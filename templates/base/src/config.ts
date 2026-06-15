// Stay'Core PMS — public booking engine connection.
//
// In dev: requests go through Vite's proxy (/pms-api → api.stay-core.com) to
// avoid CORS issues while iterating locally.
// In prod: the bundle calls the API directly. The origin must be whitelisted
// on the org's BookingEngineConfig.allowed_origins, or covered by a custom_domain.

export const PMS_BASE_URL = import.meta.env.DEV
  ? '/pms-api/api/v1'
  : 'https://api.stay-core.com/api/v1';

// {{PMS_ORG_SLUG}} — replaced by the CLI at scaffold time.
export const PMS_ORG_SLUG = '{{PMS_ORG_SLUG}}';

// {{BRAND_NAME}} — shown in titles, navbar, footer.
export const BRAND_NAME = '{{BRAND_NAME}}';

// {{BRAND_TAGLINE}} — short pitch shown on hero & meta description.
export const BRAND_TAGLINE = '{{BRAND_TAGLINE}}';

// Stripe public key fallback: the PMS returns the live key per org at runtime
// (via the /book/{slug} endpoint). This is only used if the runtime call fails.
export const STRIPE_PUBLIC_KEY_FALLBACK = import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '';

// Booking engine URL (legacy alias for direct linking — kept in sync with PMS_BASE_URL).
export const PMS_BOOKING_URL = `${PMS_BASE_URL}/book/${PMS_ORG_SLUG}`;
