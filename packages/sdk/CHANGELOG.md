# @staycore/booking-sdk

## 0.3.0

### Minor Changes

- Taxe de séjour conforme (par personne / nuit, mineurs exonérés) + nuit orpheline réservable.

  **SDK (`@staycore/booking-sdk`)**

  - `PriceQuoteRequest` et `CheckoutRequest` acceptent deux champs optionnels : `adults_count?` (adultes assujettis) et `children_count?` (enfants -18 ans, exonérés). Transmis tels quels au backend → calcul de taxe de séjour conforme côté serveur.
  - `PriceQuote` expose `tourism_tax_detail?` (nouveau type `TourismTaxDetail` : mode/régime, tarif par personne et par nuit, plafond appliqué…) pour afficher le détail du calcul.
  - `usePrice` recalcule désormais quand `adults_count` / `children_count` changent.

  Non-breaking : les consommateurs qui n'envoient que `guests_count` voient zéro changement (le backend compte alors tout le monde comme adulte).

  **create-staycore-site (template de base)**

  - Formulaire de réservation : le sélecteur unique « voyageurs » devient **Adultes + Enfants (-18 ans)** ; les compteurs sont propagés au prix et au checkout.
  - Calendrier (`DatePickerCalendar`) : correction de la **nuit orpheline** — un jour d'arrivée d'une autre réservation est désormais cliquable comme **date de départ** (raisonnement en nuits, type Airbnb). On peut donc réserver une nuit isolée entre deux séjours. Bonus : impossible de sélectionner un départ qui enjambe une nuit déjà occupée (plus d'erreur backend trompeuse).
  - `SDK_VERSION` du scaffold relevé à `^0.3.0` pour que les nouveaux sites épinglent le SDK conforme.

  Les sites déjà générés ne reçoivent pas ces changements automatiquement (template copié) — voir `MIGRATION.md`.

## 0.2.3

### Patch Changes

- Fix UX écran final quand le backend bascule en bypass Stripe (org en test mode + clé `pk_live_*`).

  **Avant 0.2.3** : le template tombait dans la branche `payment_mode === 'request'` qui affichait _« Demande envoyée — nous reviendrons vers vous rapidement par email »_, suggérant à tort qu'on attendait une validation admin. En réalité la résa était déjà confirmée, le mail déjà envoyé, les scénarios déjà déclenchés.

  **Après 0.2.3** :

  - SDK : `CheckoutResponse` expose deux nouveaux champs optionnels : `auto_confirmed_for_test?: boolean` et `reservation_id?: number`.
  - Template : si `auto_confirmed_for_test === true`, on saute directement à l'écran `confirmation` (skip Stripe Elements, skip écran "Demande envoyée"). L'écran affiche un badge ambre **🧪 Réservation de test — aucun paiement n'a été effectué** + un titre adapté + un paragraphe explicatif détaillant ce qui a tourné (mail, scénarios, code d'accès) et ce qui a été skip (paiement, lock calendrier).

  Non-breaking : les anciens consommateurs qui n'utilisent pas le test mode voient zéro changement.

## 0.2.2

### Patch Changes

- 3 bugfixes critiques détectés au premier test E2E du toolkit avec un vrai org (STAYFLEX IMMO, 27 properties dont 2 "Studio Soleil") :

  **SDK — `AvailabilityCalendar` type**

  L'API renvoie `data: [...]` (tableau plat de jours) — pas `data: { property_id, days: [...] }` comme le typait le SDK v0.2. Le template crashait avec `Cannot read properties of undefined (reading 'forEach')` sur `availability.data?.days` au mount du `<BookingForm>` à `/reserver`.

  Fix : `AvailabilityCalendar` est maintenant l'alias direct `AvailabilityCalendarDay[]`. Le type `AvailabilityCalendarLegacy` reste exporté en `@deprecated` pour ne pas casser brutalement les consommateurs qui l'auraient déjà importé. Ajout du champ `min_stay?: number` (renvoyé par l'API mais absent du type).

  Le `templates/base/src/components/booking/BookingForm.tsx` itère désormais directement sur `availability.data` après `Array.isArray()` guard.

  **CLI — dedupe des slugs de properties**

  Si deux properties slugifient en une même chaîne (deux "Studio Soleil"), React levait un warning `Encountered two children with the same key` et le routing `/properties/{slug}` était ambigu. Le scaffolder ajoute désormais un suffixe `-2`, `-3`, … sur les duplicates.

  **Template — favicon par défaut**

  Le `<link rel="icon">` n'existait pas dans `index.html` → Chrome demandait `/favicon.ico` et émettait un 404. Ajout du `favicon.svg` Stay'Core dans `public/` + `<link>` dans le `<head>`.

## 0.2.1

### Patch Changes

- Migrate documentation URLs from `staycore-booking-toolkit-docs.vercel.app` to the official custom domain **`dbt-docs.stay-core.com`**.

  User-visible change: `npx create-staycore-site --help` now prints the canonical docs URL. The runtime API endpoints, types, and behaviors are unchanged — purely a doc-URL refresh.

## 0.2.0

### Minor Changes

- Add test mode support for the booking engine.

  - `OrgConfig.config.test_mode: boolean` exposed by `pms.config()` — `true` when the org has enabled "test mode" in its Stay'Core dashboard.
  - `CheckoutResponse.is_test?: boolean` mirrors the test marker on the freshly created booking.
  - Scaffolded sites now ship with a `<TestModeBanner />` (sticky amber bar) that auto-appears whenever `config.test_mode === true`. Real guests can't mistake a test environment for the real site.

  When test mode is ON:

  - The Stay'Core backend skips availability checks at checkout time
  - Reservations are flagged `is_test=true` and excluded from analytics, billing, channel sync
  - No propagation to Channex / Airbnb / Booking
  - Admins can purge synthetic data anytime via `DELETE /api/booking-engine/test-bookings`

  Toggle in dashboard PMS: `/booking-engine` → card "🧪 Mode test".

## 0.1.0

### Minor Changes

- 47e23fa: Initial release of `@staycore/booking-sdk`.

  - Typed HTTP client targeting `/api/v1/book/{slug}` of the Stay'Core PMS public booking engine.
  - 8 endpoints covered: org config, properties, availability, price, checkout, coupon validation, booking status, payment confirmation.
  - Optional React hooks under the `/react` subpath: `StayCoreProvider`, `useOrgConfig`, `useProperties`, `useAvailability`, `usePrice`, `useCheckout`.
  - Strict TypeScript types matching the contract enforced by `backend/tests/Feature/Api/V1/BookingContractTest.php`.
  - `StayCoreApiError` class with `status`, `body`, `endpoint`, `isClientError`, `isServerError` helpers.
  - Pure ESM, fetch-based, runs in Node 20+, browsers, edge runtimes, Cloudflare Workers.
