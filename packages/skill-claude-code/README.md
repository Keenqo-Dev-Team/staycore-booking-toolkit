# staycore-direct-booking — Claude Code Skill

> Scaffolde un site web de réservation directe sur-mesure intégré au PMS [Stay'Core](https://stay-core.com), directement depuis Claude Code.

## Installation

### Option A — Marketplace Anthropic (recommandé)

> *(en cours de soumission — voir dbt-docs.stay-core.com pour le statut)*

Dans Claude Code :

```
/plugin install staycore-direct-booking
```

### Option B — Repo git direct

```bash
claude --plugin-dir https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit/tree/main/packages/skill-claude-code
```

### Option C — Local pour développement

```bash
git clone https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit
claude --plugin-dir ./staycore-booking-toolkit/packages/skill-claude-code
```

## Utilisation

Une fois le skill installé, ouvre Claude Code dans un dossier vide et dis quelque chose comme :

> « Crée-moi un site pour ma love-room à Metz, mon org STAYCORE c'est `mon-org` »

Le skill se déclenche automatiquement, te demande les détails manquants, valide ton org sur l'API Stay'Core, puis appelle `npx create-staycore-site` avec les bons paramètres. À la fin tu as un projet Vite/React/TS prêt à lancer (`npm run dev`).

## Autres agents (Codex / Cursor / Windsurf)

Le format `SKILL.md` est propriétaire Claude Code. Pour les autres agents, on fournit un **`AGENTS.md` miroir** : ils peuvent le lire et suivre les mêmes étapes manuellement. Le CLI `create-staycore-site` est universel — tout agent capable d'exécuter `npx` peut l'utiliser.

## Présets visuels

- 💜 `love-room` — Romantique, violet/or
- 🏰 `chateau-luxe` — Patrimoine, or/crème
- 🌿 `gite-nature` — Authentique, vert sauge
- 🏙️ `city-business` — Urbain, bleu nuit

## Liens

- 📖 Docs complètes : https://dbt-docs.stay-core.com
- 📦 CLI npm : https://www.npmjs.com/package/create-staycore-site
- 🧩 SDK npm : https://www.npmjs.com/package/@staycore/booking-sdk
- 🐛 Issues : https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit/issues

## License

MIT © [Keenqo](https://keenqo.fr) — Stay'Core
