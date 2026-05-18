# STAYCORE Direct Booking Toolkit

> **Officiel** — Scaffolde un site de réservation directe sur-mesure intégré au PMS [Stay'Core](https://stay-core.com) en quelques secondes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/@staycore/booking-sdk?label=%40staycore%2Fbooking-sdk)](https://www.npmjs.com/package/@staycore/booking-sdk)
[![npm](https://img.shields.io/npm/v/create-staycore-site?label=create-staycore-site)](https://www.npmjs.com/package/create-staycore-site)

---

## Trois façons de créer ton site

| Tu es… | Outil | Quickstart |
|---|---|---|
| Conciergerie non-tech | **Module Website intégré** au PMS | [dashboard PMS](https://app.stay-core.com/dashboard/website) → block builder no-code |
| Dev / agence avec un assistant IA | **Skill Claude Code** | `claude /staycore-direct-booking` |
| Dev qui veut juste un boilerplate | **CLI npx** | `npx create-staycore-site@latest` |

Les trois aboutissent à un site qui consomme l'API publique versionnée `/api/v1/book/{org_slug}/...` du PMS Stay'Core.

---

## Quickstart CLI

```bash
npx create-staycore-site@latest mon-site \
  --org-slug=mon-org \
  --preset=love-room

cd mon-site
pnpm install
pnpm dev
```

Tu obtiens un projet Vite + React + TypeScript + Tailwind, déjà branché au moteur de réservation Stay'Core (calendrier, prix, checkout Stripe, cautions, GA4 Consent Mode v2, SEO JSON-LD).

---

## Packages

| Package | Description |
|---|---|
| [`@staycore/booking-sdk`](./packages/sdk) | SDK TypeScript : client typé + hooks React + composants prêts à l'emploi |
| [`create-staycore-site`](./packages/create-staycore-site) | CLI `npx` de scaffolding |
| [`staycore-direct-booking`](./packages/skill-claude-code) | Skill Claude Code distribué sur le marketplace Anthropic |

---

## Architecture

```
packages/sdk                  → @staycore/booking-sdk (npm)
packages/create-staycore-site → create-staycore-site (npm)
packages/skill-claude-code    → Skill Claude Code (marketplace)
templates/base                → Template Vite/React/TS canonique
templates/presets             → 4 presets visuels (love-room, chateau-luxe…)
apps/docs                     → docs.stay-core.com/booking-toolkit (Nextra)
e2e                           → Tests bout-en-bout (scaffold + build + smoke)
```

---

## Liens

- 📖 **Documentation complète** : https://staycore-booking-toolkit-docs.vercel.app *(en attente DNS docs.stay-core.com)*
- 🐛 **Issues** : https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit/issues
- 🛠️ **Stay'Core PMS** : https://stay-core.com

---

## Licence

MIT © [Keenqo](https://keenqo.fr) — Stay'Core
