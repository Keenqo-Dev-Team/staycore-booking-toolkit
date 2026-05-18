# @staycore/booking-sdk

## 0.1.0

### Minor Changes

- 47e23fa: Initial release of `@staycore/booking-sdk`.

  - Typed HTTP client targeting `/api/v1/book/{slug}` of the Stay'Core PMS public booking engine.
  - 8 endpoints covered: org config, properties, availability, price, checkout, coupon validation, booking status, payment confirmation.
  - Optional React hooks under the `/react` subpath: `StayCoreProvider`, `useOrgConfig`, `useProperties`, `useAvailability`, `usePrice`, `useCheckout`.
  - Strict TypeScript types matching the contract enforced by `backend/tests/Feature/Api/V1/BookingContractTest.php`.
  - `StayCoreApiError` class with `status`, `body`, `endpoint`, `isClientError`, `isServerError` helpers.
  - Pure ESM, fetch-based, runs in Node 20+, browsers, edge runtimes, Cloudflare Workers.
