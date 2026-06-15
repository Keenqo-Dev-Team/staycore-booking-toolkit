#!/usr/bin/env node
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs, printHelp, type CliArgs } from './args.js';
import { AVAILABLE_PRESETS, isPreset, promptChoice, promptInput, type PresetId } from './prompts.js';
import { validateOrg } from './validate.js';
import { scaffold } from './scaffold.js';
import { gitInit, installDependencies } from './installer.js';
import { bold, cyan, dim, gold, green, logError, logInfo, logStep, logSuccess } from './logger.js';

const PROJECT_DIR = path.dirname(fileURLToPath(import.meta.url));

async function readVersion(): Promise<string> {
  try {
    // dist/cli.js → ../package.json
    const pkgPath = path.resolve(PROJECT_DIR, '..', 'package.json');
    const raw = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.version) {
    console.log(await readVersion());
    return 0;
  }

  console.log('');
  console.log(bold(gold('  ╭───────────────────────────────────────╮')));
  console.log(bold(gold('  │  create-staycore-site                 │')));
  console.log(bold(gold('  │  Direct booking website scaffolder    │')));
  console.log(bold(gold('  ╰───────────────────────────────────────╯')));
  console.log('');

  const interactive = !args.nonInteractive && process.stdin.isTTY;

  const projectName = await resolveProjectName(args, interactive);
  const projectDir = path.resolve(process.cwd(), projectName);

  await ensureEmptyDir(projectDir);

  const orgSlug = await resolveOrgSlug(args, interactive);
  const baseUrl = args.apiBaseUrl;

  logStep(1, 5, `Validating org ${cyan(orgSlug)}…`);
  const { config, properties } = await validateOrg(orgSlug, baseUrl);
  logSuccess(`Found ${bold(config.organization.name)} (${properties.length} properties).`);

  const brandName = await resolveBrandName(args, interactive, config.organization.name);
  const brandTagline =
    args.brandTagline ??
    (interactive
      ? await promptInput('Brand tagline', {
          default: 'Réservation directe, sans commission.',
        })
      : 'Réservation directe, sans commission.');

  const preset = await resolvePreset(args, interactive);

  logStep(2, 5, `Scaffolding ${cyan(projectName)}…`);
  await scaffold({
    projectDir,
    projectName,
    orgSlug,
    brandName,
    brandTagline,
    apiBaseUrl: baseUrl,
    preset,
    properties,
  });
  logSuccess(`Files written to ${dim(projectDir)}`);

  if (!args.noInstall) {
    logStep(3, 5, 'Installing dependencies…');
    const { pm, code } = await installDependencies(projectDir);
    if (code === 0) {
      logSuccess(`Installed with ${pm}.`);
    } else {
      logError(`${pm} install exited with code ${code}. You can re-run it manually.`);
    }
  } else {
    logStep(3, 5, dim('Skipping dependency install (--no-install).'));
  }

  if (!args.noGit) {
    logStep(4, 5, 'Initialising git repository…');
    const code = await gitInit(projectDir);
    if (code === 0) {
      logSuccess('Git repo initialised with first commit.');
    }
  } else {
    logStep(4, 5, dim('Skipping git init (--no-git).'));
  }

  logStep(5, 5, 'Done.');

  console.log('');
  console.log(green(bold('  Your site is ready.')));
  console.log('');
  console.log(`  ${bold('cd')} ${projectName}`);
  if (args.noInstall) console.log(`  ${bold('npm install')}`);
  console.log(`  ${bold('npm run dev')}`);
  console.log('');
  console.log(dim('  Next steps:'));
  console.log(dim('  • Edit src/data/properties.ts to enrich your listings (photos, copy).'));
  console.log(dim('  • Tweak src/index.css for custom branding (or pick another preset).'));
  console.log(dim('  • Deploy to Vercel: vercel deploy --prod'));
  console.log(dim('  • Add your custom domain in the Stay\'Core dashboard so CORS lets it in.'));
  console.log('');

  return 0;
}

async function resolveProjectName(args: CliArgs, interactive: boolean): Promise<string> {
  if (args.projectName) return args.projectName;
  if (!interactive) throw new Error('Missing project name. Pass it as the first positional arg.');
  const name = await promptInput('Project name', { required: true, default: 'my-staycore-site' });
  return slugify(name);
}

async function resolveOrgSlug(args: CliArgs, interactive: boolean): Promise<string> {
  if (args.orgSlug) return args.orgSlug;
  if (!interactive) throw new Error('Missing --org-slug. Pass your Stay\'Core organization slug.');
  return promptInput("Stay'Core organization slug", { required: true });
}

async function resolveBrandName(
  args: CliArgs,
  interactive: boolean,
  fallback: string,
): Promise<string> {
  if (args.brandName) return args.brandName;
  if (!interactive) return fallback;
  return promptInput('Brand display name', { default: fallback });
}

async function resolvePreset(args: CliArgs, interactive: boolean): Promise<PresetId> {
  if (args.preset) {
    if (!isPreset(args.preset)) {
      throw new Error(
        `Unknown preset "${args.preset}". Choose one of: ${AVAILABLE_PRESETS.join(', ')}`,
      );
    }
    return args.preset;
  }
  if (!interactive) return 'love-room';
  const choice = await promptChoice('Pick a visual preset', AVAILABLE_PRESETS, 'love-room');
  if (!isPreset(choice)) return 'love-room';
  return choice;
}

async function ensureEmptyDir(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir);
    if (entries.length > 0) {
      throw new Error(`Target directory ${dir} is not empty.`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw err;
  }
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
