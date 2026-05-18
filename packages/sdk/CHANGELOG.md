# @staycore/booking-sdk

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
