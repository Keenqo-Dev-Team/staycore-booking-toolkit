# create-staycore-site

> Scaffold a direct booking website wired to the **Stay'Core PMS** in seconds.

[![npm](https://img.shields.io/npm/v/create-staycore-site)](https://www.npmjs.com/package/create-staycore-site)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```bash
npx create-staycore-site@latest mon-site \
  --org-slug=mon-org \
  --preset=love-room

cd mon-site
npm install   # if you used --no-install
npm run dev
```

What you get:

- A Vite + React + TypeScript + Tailwind project
- Pre-wired to `@staycore/booking-sdk` (booking calendar, availability, price, Stripe checkout, payment confirmation)
- Pre-filled with your org's properties (pulled live from the Stay'Core PMS at scaffold time)
- A theme picked from 4 production-ready presets: **love-room**, **chateau-luxe**, **gite-nature**, **city-business**
- GA4 Consent Mode v2 cookie banner ready, JSON-LD `LodgingBusiness` on property pages, OG tags
- Git repository initialised, one tidy initial commit

## CLI flags

```bash
npx create-staycore-site@latest <name> [options]
```

| Flag | Description |
|---|---|
| `<name>` | Project folder name (positional) |
| `--org-slug=<slug>` | Stay'Core organization slug (**required**) |
| `--preset=<id>` | Visual preset: `love-room` (default), `chateau-luxe`, `gite-nature`, `city-business` |
| `--brand-name="My Brand"` | Display name shown in titles, navbar, footer |
| `--brand-tagline="..."` | Short pitch for the hero + meta description |
| `--api-base-url=<url>` | Override API base URL (default: `https://api.stay-core.com/api/v1`) |
| `--no-install` | Skip `npm install` step |
| `--no-git` | Skip `git init` step |
| `--non-interactive`, `-y` | Use defaults / fail on missing required input |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Print CLI version |

## Non-interactive mode

Perfect for CI, agents (Claude Code, Codex, Cursor) and scripts:

```bash
npx create-staycore-site@latest my-site \
  --org-slug=mon-org \
  --preset=chateau-luxe \
  --brand-name="Domaine de Saint-Roch" \
  --brand-tagline="Demeures de caractère, accueil sur-mesure." \
  --no-install \
  --no-git \
  --non-interactive
```

## Presets

| ID | Vibe | Palette | Fonts |
|---|---|---|---|
| `love-room` | Romantique, sensuel | Violet / or | Cormorant Garamond + Inter |
| `chateau-luxe` | Patrimoine, classique | Or / crème | Playfair Display + Lato |
| `gite-nature` | Authentique, vert | Terre / sauge | Lora + Source Sans 3 |
| `city-business` | Urbain, sobre | Bleu nuit / blanc | Manrope |

Each preset is a JSON file at `templates/presets/<id>.json`. Want a 5th preset? Open a PR.

## After scaffolding

1. `cd mon-site && npm install && npm run dev` — verify the site boots
2. Edit `src/data/properties.ts` to enrich your listings (photos, copy, amenities)
3. Tweak `src/index.css` and `tailwind.config.js` for a fully custom look
4. Set up GA4 in `index.html` (replace `G-XXXXXXXXXX`)
5. Deploy: `vercel deploy --prod`
6. Add your custom domain in the Stay'Core dashboard (Settings → Custom domains) so CORS lets the API in

## License

MIT © [Keenqo](https://keenqo.fr) — Stay'Core
