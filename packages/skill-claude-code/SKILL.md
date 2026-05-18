---
name: staycore-direct-booking
description: Scaffolde un site web sur-mesure (Vite/React/TypeScript/Tailwind) intégrant le moteur de réservation directe Stay'Core PMS. À utiliser quand l'utilisateur veut créer un site de réservation directe pour une conciergerie, une location courte durée, une love-room, un château ou un gîte connecté à Stay'Core.
allowed-tools: Read, Write, Edit, Bash(npx*), Bash(npm install*), Bash(pnpm*), Bash(git init), Bash(node*)
---

# STAYCORE Direct Booking — Scaffolder un site sur-mesure

> Skill officiel — placeholder (Phase 5 — implémentation à venir).

Ce skill orchestre la création d'un site de réservation directe via le CLI `create-staycore-site`.

## Flux

1. Demande à l'utilisateur : nom du projet, `org_slug` Stay'Core, preset visuel (love-room / chateau-luxe / gite-nature / city-business).
2. Valide que l'organisation existe via `GET https://api.stay-core.com/api/v1/book/{slug}`.
3. Lance `npx create-staycore-site@latest <name> --org-slug=<slug> --preset=<preset> --non-interactive`.
4. Personnalise post-scaffold (palette, copy, hero) selon la demande utilisateur.
5. Propose les next steps : déploiement Vercel, configuration custom domain côté PMS, GA4.

## Liens

- Docs : https://docs.stay-core.com/booking-toolkit
- CLI : https://www.npmjs.com/package/create-staycore-site
- API : https://api.stay-core.com/api/v1/book/{org_slug}
