# Agent instructions — STAYCORE Direct Booking (Codex / Cursor / Windsurf)

> Miroir de `SKILL.md` pour les agents qui ne supportent pas le format Claude Code.

## Objectif

Scaffolde un site web sur-mesure intégrant le moteur de réservation Stay'Core PMS.

## Étapes

1. Demande à l'utilisateur :
   - Nom du projet (kebab-case)
   - `org_slug` Stay'Core (slug de l'organisation)
   - Preset visuel : `love-room` | `chateau-luxe` | `gite-nature` | `city-business`
2. Valide l'org avec `curl -s https://api.stay-core.com/api/v1/book/{slug}` (vérifie status 200 + champ `data.organization`).
3. Lance : `npx create-staycore-site@latest <name> --org-slug=<slug> --preset=<preset>`
4. Adapte la palette / copywriting selon la demande utilisateur.

## Endpoints utiles (API publique v1)

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/v1/book/{slug}` | Config org + clé Stripe publique |
| GET | `/api/v1/book/{slug}/properties` | Liste des biens |
| GET | `/api/v1/book/{slug}/properties/{id}/price?check_in=&check_out=&guests_count=` | Prix + dispo |
| POST | `/api/v1/book/{slug}/checkout` | Crée résa + PaymentIntent |

Voir la doc complète : https://docs.stay-core.com/booking-toolkit
