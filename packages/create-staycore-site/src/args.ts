/**
 * Tiny argv parser tailored for the CLI. Supports:
 *   create-staycore-site <name?> [--org-slug=...] [--preset=...] [--brand-name="..."]
 *                                [--api-base-url=...] [--no-install] [--no-git]
 *                                [--non-interactive] [-y|--yes] [-h|--help] [-v|--version]
 */

export type CliArgs = {
  projectName?: string;
  orgSlug?: string;
  preset?: string;
  brandName?: string;
  brandTagline?: string;
  apiBaseUrl?: string;
  noInstall: boolean;
  noGit: boolean;
  nonInteractive: boolean;
  yes: boolean;
  help: boolean;
  version: boolean;
};

const FLAG = {
  '--no-install': 'noInstall',
  '--no-git': 'noGit',
  '--non-interactive': 'nonInteractive',
  '-y': 'yes',
  '--yes': 'yes',
  '-h': 'help',
  '--help': 'help',
  '-v': 'version',
  '--version': 'version',
} as const;

const KV = {
  '--org-slug': 'orgSlug',
  '--preset': 'preset',
  '--brand-name': 'brandName',
  '--brand-tagline': 'brandTagline',
  '--api-base-url': 'apiBaseUrl',
} as const;

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    noInstall: false,
    noGit: false,
    nonInteractive: false,
    yes: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;

    if (a in FLAG) {
      const key = FLAG[a as keyof typeof FLAG];
      (out as Record<string, unknown>)[key] = true;
      continue;
    }

    let matched = false;
    for (const prefix of Object.keys(KV) as Array<keyof typeof KV>) {
      if (a.startsWith(`${prefix}=`)) {
        const key = KV[prefix];
        (out as Record<string, unknown>)[key] = a.slice(prefix.length + 1);
        matched = true;
        break;
      }
      if (a === prefix && i + 1 < argv.length) {
        const key = KV[prefix];
        (out as Record<string, unknown>)[key] = argv[++i];
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Positional: first non-flag arg is the project name.
    if (!a.startsWith('-') && !out.projectName) {
      out.projectName = a;
    }
  }

  return out;
}

export function printHelp(): void {
  console.log(`
create-staycore-site — scaffold a direct booking website wired to Stay'Core PMS

USAGE
  npx create-staycore-site@latest <name> [options]

OPTIONS
  --org-slug=<slug>          Stay'Core organization slug (required)
  --preset=<id>              Visual preset: love-room | chateau-luxe | gite-nature | city-business
  --brand-name="My Brand"    Display name for the site
  --brand-tagline="..."      Short tagline used in hero + meta description
  --api-base-url=<url>       Override the API base URL (default: https://api.stay-core.com/api/v1)
  --no-install               Skip npm install step
  --no-git                   Skip git init step
  --non-interactive, -y      Use defaults / fail on missing required input
  --help, -h                 Show this help
  --version, -v              Show CLI version

EXAMPLE
  npx create-staycore-site@latest mon-site \\
      --org-slug=stayflex-immo \\
      --preset=love-room \\
      --brand-name="Les Suites Bisous"

DOCS
  https://docs.stay-core.com/booking-toolkit
`);
}
