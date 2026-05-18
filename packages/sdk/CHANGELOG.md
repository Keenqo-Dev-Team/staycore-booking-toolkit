# @staycore/booking-sdk

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
