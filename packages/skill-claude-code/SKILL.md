---
name: staycore-direct-booking
description: Scaffolde un site web sur-mesure (Vite/React/TypeScript/Tailwind) intégrant le moteur de réservation directe Stay'Core PMS. À utiliser quand l'utilisateur veut créer un site de réservation directe pour une conciergerie, une location courte durée, une love-room, un château, un gîte ou un appart-hôtel d'affaires connecté à Stay'Core.
allowed-tools: Read, Write, Edit, Bash(npx create-staycore-site*), Bash(curl*), Bash(node*), Bash(npm install*), Bash(npm run*), Bash(pnpm*), Bash(git init), Bash(git add*), Bash(git commit*), Bash(vercel*)
---

# STAYCORE Direct Booking — Scaffolder un site sur-mesure

Tu es un assistant qui aide un utilisateur à créer un site de **réservation directe** branché au PMS Stay'Core (https://stay-core.com). Le site permet aux clients de réserver sans passer par Airbnb / Booking, donc sans commission.

## Quand déclencher ce skill

L'utilisateur dit (ou équivalent) :
- « Crée-moi un site pour ma conciergerie / love-room / château / gîte / appart-hôtel »
- « Je veux faire mon propre site avec un moteur de résa connecté à Stay'Core »
- « Bootstrap un site React qui appelle l'API Stay'Core »
- Mentionne `stay-core.com`, `STAYCORE`, ou `Stay'Core PMS` dans le contexte d'un site web à créer

Si l'utilisateur veut juste *modifier* un site existant (pas créer), tu n'as pas besoin de ce skill — édite directement.

## Flux d'orchestration

### 1. Collecter les informations

Pose **une seule fois** ces questions à l'utilisateur (ou récupère depuis le contexte) :

| Info | Exemple |
|---|---|
| Nom du projet (dossier) | `mon-site` (kebab-case) |
| `org_slug` Stay'Core | `stayflex-immo` (slug de l'organisation dans le PMS) |
| Nom de marque affiché | `"Les Suites Bisous"` |
| Tagline courte | `"Suites d'exception pour parenthèses romantiques."` |
| Preset visuel | `love-room` / `chateau-luxe` / `gite-nature` / `city-business` |

Si l'utilisateur ne connaît pas son `org_slug`, dis-lui où le trouver : **Dashboard Stay'Core → Paramètres → Organisation → Slug public**.

### 2. Valider l'organisation

Avant de scaffolder, pinge l'API pour confirmer que l'org existe :

```bash
curl -s "https://api.stay-core.com/api/v1/book/{ORG_SLUG}" | head -c 400
```

Tu dois voir `"success": true` et `"organization": { "name": "..." }`. Si tu obtiens 404, l'org n'a pas activé le moteur public — demande à l'utilisateur de l'activer dans son dashboard PMS avant de continuer.

### 3. Lancer le scaffolder

```bash
npx create-staycore-site@latest <PROJECT_NAME> \
  --org-slug=<ORG_SLUG> \
  --preset=<PRESET> \
  --brand-name="<BRAND_NAME>" \
  --brand-tagline="<BRAND_TAGLINE>" \
  --non-interactive
```

Le CLI s'occupe de :
- copier le template Vite + React + TS + Tailwind
- pré-remplir `src/data/properties.ts` avec les vraies propriétés de l'org
- appliquer le preset visuel (CSS variables + fonts Google)
- substituer `{{BRAND_NAME}}`, `{{BRAND_TAGLINE}}`, `{{PMS_ORG_SLUG}}`
- `npm install` + `git init` + premier commit

### 4. Personnaliser post-scaffold

L'utilisateur a maintenant une base solide. Propose-lui de :

1. **Enrichir les propriétés** — éditer `src/data/properties.ts` avec de vraies photos, descriptions détaillées, amenities pertinentes
2. **Adapter la palette** — modifier les `--brand-color-*` dans `src/index.css` si le preset n'est pas exactement bon
3. **Ajouter une page dédiée** — Expérience, About, FAQ thématique… il suffit de créer un composant dans `src/pages/` et de l'ajouter au switch de `src/App.tsx`
4. **Configurer GA4** — remplacer `G-XXXXXXXXXX` dans `index.html` par leur Measurement ID
5. **Déployer sur Vercel** — `vercel deploy --prod` puis ajouter le custom domain dans le Stay'Core dashboard (Paramètres → Custom domains) pour que CORS l'autorise

## API publique Stay'Core (référence)

Tous les endpoints sont sans authentification, préfixe `/api/v1/book/{org_slug}` :

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/v1/book/{slug}` | Config org + clé Stripe publique |
| GET | `/api/v1/book/{slug}/properties` | Liste des biens actifs |
| GET | `/api/v1/book/{slug}/properties/{id}/availability` | Calendrier mensuel |
| GET | `/api/v1/book/{slug}/properties/{id}/price?check_in=&check_out=&guests_count=&adults_count=&children_count=` | Prix + dispo (`adults_count`/`children_count` optionnels → taxe de séjour conforme, mineurs exonérés ; réponse : `tourism_tax` + `tourism_tax_detail`) |
| POST | `/api/v1/book/{slug}/checkout` | Crée résa + PaymentIntent Stripe |
| POST | `/api/v1/book/{slug}/booking/{token}/confirm` | Confirme paiement |
| GET | `/api/v1/book/{slug}/booking/{token}` | Suivi réservation |
| POST | `/api/v1/book/{slug}/validate-coupon` | Valider code promo |

Tous renvoient un body `{ success: boolean, data?: T, message?: string }`. Réponses en JSON, header de version `X-Staycore-API-Version: v1`.

Le SDK officiel `@staycore/booking-sdk` (utilisé par le template) typifie tout : `pms.config()`, `pms.properties.list()`, `pms.price.compute(id, params)`, `pms.checkout.create(payload)`, hooks React `useAvailability`, `usePrice`, `useCheckout`, etc.

## Liens

- 📦 CLI : https://www.npmjs.com/package/create-staycore-site
- 🧩 SDK : https://www.npmjs.com/package/@staycore/booking-sdk
- 📖 Docs : https://dbt-docs.stay-core.com
- 🐛 Issues : https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit/issues
- 🛠️ Stay'Core PMS : https://stay-core.com

## Garde-fous

- **Ne demande jamais le mot de passe ou des clés API** : le moteur de réservation est public, pas d'auth nécessaire pour scaffolder
- **Ne push pas vers GitHub** sans demande explicite — le `git init` du CLI crée juste un commit local
- **N'invente pas de presets** — il n'y en a que 4. Si l'utilisateur veut un autre style, après le scaffold tu peux adapter `src/index.css` et les composants à la main
