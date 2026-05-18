import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Property } from '@staycore/booking-sdk';
import type { PresetId } from './prompts.js';

type Preset = {
  id: string;
  name: string;
  description: string;
  css: Record<string, string>;
  fonts?: string[];
  copy?: {
    brand_tagline?: string;
    hero_image?: string;
  };
};

type PackageJson = {
  name?: string;
  private?: boolean;
  description?: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
};

const SDK_VERSION = '^0.1.0'; // bumped here when the published SDK gets a new minor.

const PROJECT_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Find the templates folder, whether we are running from sources (monorepo)
 * or from an installed npm package (where templates/ sits next to dist/).
 */
async function resolveTemplatesRoot(): Promise<string> {
  const candidates = [
    path.resolve(PROJECT_DIR, '..', 'templates'), // installed package: dist/ + templates/
    path.resolve(PROJECT_DIR, '..', '..', '..', '..', 'templates'), // monorepo dev: packages/create-staycore-site/dist/*
    path.resolve(PROJECT_DIR, '..', '..', '..', 'templates'), // monorepo dev (build dist nested differently)
  ];
  for (const c of candidates) {
    try {
      const stat = await fs.stat(path.join(c, 'base', 'package.json'));
      if (stat.isFile()) return c;
    } catch {
      // try next
    }
  }
  throw new Error(
    `Cannot find the templates folder. Tried:\n${candidates.map((c) => `  - ${c}`).join('\n')}`,
  );
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.vite') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}

export type ScaffoldOptions = {
  projectDir: string;
  projectName: string;
  orgSlug: string;
  brandName: string;
  brandTagline: string;
  apiBaseUrl?: string;
  preset: PresetId;
  properties: Property[];
};

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const templatesRoot = await resolveTemplatesRoot();
  const baseDir = path.join(templatesRoot, 'base');
  const presetFile = path.join(templatesRoot, 'presets', `${opts.preset}.json`);

  let preset: Preset;
  try {
    preset = JSON.parse(await fs.readFile(presetFile, 'utf8')) as Preset;
  } catch {
    throw new Error(`Preset "${opts.preset}" not found at ${presetFile}`);
  }

  await fs.mkdir(opts.projectDir, { recursive: true });
  const dirEntries = await fs.readdir(opts.projectDir);
  if (dirEntries.length > 0) {
    throw new Error(`Target directory ${opts.projectDir} is not empty. Aborting.`);
  }

  // 1. Copy base template
  await copyDir(baseDir, opts.projectDir);

  // 2. Rewrite package.json (name + replace workspace:^ with real SDK version)
  await rewriteJson<PackageJson>(path.join(opts.projectDir, 'package.json'), (pkg) => {
    pkg.name = opts.projectName;
    pkg.private = true;
    pkg.description = `${opts.brandName} — direct booking website (Stay'Core).`;
    if (pkg.dependencies && pkg.dependencies['@staycore/booking-sdk']) {
      pkg.dependencies['@staycore/booking-sdk'] = SDK_VERSION;
    }
    return pkg;
  });

  // 3. Replace placeholders in known files
  const tagline = opts.brandTagline || preset.copy?.brand_tagline || 'Réservation directe, sans commission.';
  const placeholders: Record<string, string> = {
    '{{BRAND_NAME}}': opts.brandName,
    '{{BRAND_TAGLINE}}': tagline,
    '{{PMS_ORG_SLUG}}': opts.orgSlug,
    '{{GA4_MEASUREMENT_ID}}': 'G-XXXXXXXXXX',
  };
  await replaceInFiles(opts.projectDir, placeholders, [
    'index.html',
    'src/config.ts',
    'src/main.tsx',
  ]);

  // 4. Apply preset CSS variables (overlay on index.css :root block)
  await applyPresetCss(path.join(opts.projectDir, 'src/index.css'), preset);

  // 5. Inject preset fonts in index.html <head>
  if (preset.fonts && preset.fonts.length > 0) {
    await injectFonts(path.join(opts.projectDir, 'index.html'), preset.fonts);
  }

  // 6. Pre-fill properties from the PMS
  if (opts.properties.length > 0) {
    await rewriteProperties(path.join(opts.projectDir, 'src/data/properties.ts'), opts.properties);
  }

  // 7. Override API base URL if provided
  if (opts.apiBaseUrl) {
    await replaceInFiles(
      opts.projectDir,
      { 'https://api.stay-core.com/api/v1': opts.apiBaseUrl },
      ['src/config.ts'],
    );
  }
}

async function rewriteJson<T extends Record<string, unknown>>(
  file: string,
  mutate: (obj: T) => T,
): Promise<void> {
  const raw = await fs.readFile(file, 'utf8');
  const json = JSON.parse(raw) as T;
  const next = mutate(json);
  await fs.writeFile(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

async function replaceInFiles(
  root: string,
  placeholders: Record<string, string>,
  files: string[],
): Promise<void> {
  for (const rel of files) {
    const file = path.join(root, rel);
    let text: string;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch {
      continue;
    }
    for (const [needle, replacement] of Object.entries(placeholders)) {
      text = text.split(needle).join(replacement);
    }
    await fs.writeFile(file, text, 'utf8');
  }
}

async function applyPresetCss(cssFile: string, preset: Preset): Promise<void> {
  const css = await fs.readFile(cssFile, 'utf8');
  const cssVars = Object.entries(preset.css)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join('\n');
  const rootBlock = `  :root {\n${cssVars}\n  }`;
  const next = css.replace(/ {2}:root \{[\s\S]*?\n {2}\}/, rootBlock);
  await fs.writeFile(cssFile, next, 'utf8');
}

async function injectFonts(htmlFile: string, fonts: string[]): Promise<void> {
  const html = await fs.readFile(htmlFile, 'utf8');
  const links = fonts.map((href) => `    <link rel="stylesheet" href="${href}" />`).join('\n');
  const next = html.replace('</head>', `${links}\n  </head>`);
  await fs.writeFile(htmlFile, next, 'utf8');
}

async function rewriteProperties(file: string, properties: Property[]): Promise<void> {
  // Dedupe slugs : si deux properties slugifient pareil (ex. deux "Studio
  // Soleil"), on suffixe les duplicats par -2, -3, … sinon React voit deux
  // children avec la même key et le routing /properties/{slug} est ambigu.
  const slugCounts = new Map<string, number>();
  const items = properties.map((p) => {
    const baseSlug =
      (p.name as string)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `property-${p.id}`;
    const occurrence = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, occurrence + 1);
    const slug = occurrence === 0 ? baseSlug : `${baseSlug}-${occurrence + 1}`;
    const heroImage =
      p.image_url ?? 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80';
    return `  {
    slug: ${JSON.stringify(slug)},
    pmsPropertyId: ${p.id},
    name: ${JSON.stringify(p.name)},
    city: ${JSON.stringify(p.city ?? 'France')},
    shortDescription: ${JSON.stringify(p.description ?? '')},
    longDescription: ${JSON.stringify(p.description ?? '')},
    heroImage: ${JSON.stringify(heroImage)},
    gallery: [${JSON.stringify(heroImage)}],
    amenities: [
      { icon: Wifi, label: 'WiFi haut débit' },
      { icon: Bed, label: 'Lit confortable' },
      { icon: Bath, label: 'Salle de bain privative' },
      { icon: Coffee, label: 'Cuisine équipée' },
      { icon: Tv, label: 'Télévision' },
      { icon: Car, label: 'Parking à proximité' },
      { icon: Snowflake, label: 'Climatisation' },
      { icon: Sparkles, label: 'Ménage inclus' },
    ],
    seo: {
      title: ${JSON.stringify(`${p.name} — Réservation directe`)},
      description: ${JSON.stringify(p.description ?? '')},
      keywords: ${JSON.stringify(`location ${p.city ?? ''}, réservation directe`)},
    },
    schema: {
      streetAddress: ${JSON.stringify(p.address ?? '')},
      postalCode: '',
      addressLocality: ${JSON.stringify(p.city ?? '')},
      addressCountry: ${JSON.stringify(p.country ?? 'FR')},
      latitude: '',
      longitude: '',
      priceRange: '€€',
    },
  },`;
  }).join('\n');

  const text = await fs.readFile(file, 'utf8');
  const next = text.replace(
    /export const properties: PropertyData\[\] = \[[\s\S]*?\];/,
    `export const properties: PropertyData[] = [\n${items}\n];`,
  );
  await fs.writeFile(file, next, 'utf8');
}
