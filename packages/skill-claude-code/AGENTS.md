# STAYCORE Direct Booking — Agent instructions (Codex / Cursor / Windsurf / generic)

> Miroir markdown de `SKILL.md` pour les agents qui ne supportent pas le format propriétaire Claude Code.

## Mission

Scaffolder un site web de réservation directe (Vite + React + TypeScript + Tailwind) branché au moteur de réservation public du PMS Stay'Core, en exécutant le CLI officiel `create-staycore-site`.

## Quand déclencher

L'utilisateur exprime l'intention de **créer** (pas modifier) un site de réservation directe pour une location courte durée, conciergerie, love-room, château, gîte, appart-hôtel — et mentionne `stay-core.com` / `STAYCORE` ou un PMS connecté à Stay'Core.

## Étapes

### 1. Collecte des paramètres

| Paramètre | Comment l'obtenir |
|---|---|
| `PROJECT_NAME` | Demander à l'utilisateur (kebab-case, ex: `mon-site`) |
| `ORG_SLUG` | Demander à l'utilisateur ; trouvable dans Dashboard Stay'Core → Paramètres → Organisation |
| `BRAND_NAME` | Demander, ou tirer du nom officiel de l'org après validation |
| `BRAND_TAGLINE` | Demander, sinon laisser le défaut « Réservation directe, sans commission. » |
| `PRESET` | Demander parmi : `love-room`, `chateau-luxe`, `gite-nature`, `city-business` |

### 2. Validation

```bash
curl -s "https://api.stay-core.com/api/v1/book/$ORG_SLUG"
```

Vérifier que la réponse contient `"success": true`. Sinon, dire à l'utilisateur que son org n'a pas activé le moteur public (à activer dans le dashboard PMS).

### 3. Scaffolder

```bash
npx create-staycore-site@latest "$PROJECT_NAME" \
  --org-slug="$ORG_SLUG" \
  --preset="$PRESET" \
  --brand-name="$BRAND_NAME" \
  --brand-tagline="$BRAND_TAGLINE" \
  --non-interactive
```

### 4. Personnalisation (proposer après le scaffold)

1. Enrichir `src/data/properties.ts` avec photos et descriptions
2. Ajuster `src/index.css` (couleurs CSS variables) pour un branding plus précis
3. Configurer GA4 dans `index.html` (remplacer `G-XXXXXXXXXX`)
4. Déployer sur Vercel : `vercel deploy --prod`
5. Ajouter le custom domain dans Stay'Core → Paramètres → Custom domains

## API publique v1 (référence rapide)

Endpoints sans auth, base URL : `https://api.stay-core.com/api/v1/book/{slug}`

- `GET /` → config org + Stripe public key
- `GET /properties` → liste des biens
- `GET /properties/{id}/availability` → calendrier
- `GET /properties/{id}/price?check_in=&check_out=&guests_count=` → prix
- `POST /checkout` → résa + Stripe PaymentIntent (corps : `{ property_id, guest_name, guest_email, check_in, check_out, guests_count }`)
- `POST /booking/{token}/confirm` → confirme paiement Stripe
- `GET /booking/{token}` → statut réservation
- `POST /validate-coupon` → valider code promo

Toutes les réponses suivent le schéma `{ success: boolean, data?: T, message?: string }` et incluent le header `X-Staycore-API-Version: v1`.

SDK officiel (utilisé par le template) : `@staycore/booking-sdk` (TypeScript, hooks React, classe d'erreur `StayCoreApiError`).

## Garde-fous

- Pas de credentials nécessaires (le moteur est public)
- Pas de push GitHub sans demande explicite
- Les 4 presets sont fixes ; pour un look custom, adapter le code généré
- Le CLI échoue si le dossier cible est non vide — supprimer ou choisir un autre nom

## Liens

- CLI : https://www.npmjs.com/package/create-staycore-site
- SDK : https://www.npmjs.com/package/@staycore/booking-sdk
- Docs : https://dbt-docs.stay-core.com
- Repo : https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit
