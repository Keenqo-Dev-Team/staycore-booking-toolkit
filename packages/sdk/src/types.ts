/**
 * Types for the Stay'Core public booking engine API v1.
 *
 * Source of truth: backend/app/Http/Controllers/Api/BookingEngineController.php
 * Contract guard: backend/tests/Feature/Api/V1/BookingContractTest.php
 *
 * Every response from /api/v1/book/{slug}/* follows the envelope:
 *   { success: true, data: T, message?: string }
 *   { success: false, message: string }
 */

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  message: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/book/{slug}
// ─────────────────────────────────────────────────────────────────────────────

export type OrgConfig = {
  organization: {
    name: string;
    slug: string;
    logo: string | null;
  };
  config: {
    payment_mode: 'full' | 'deposit' | 'request';
    default_locale: 'fr' | 'en';
    branding: Record<string, unknown> | null;
    terms_url: string | null;
    min_stay_nights: number | null;
    max_stay_nights: number | null;
    /**
     * When true, the org has enabled "test mode" in its dashboard. Checkouts
     * against this engine are virtual: no calendar lock, no Channex propagation,
     * no impact on analytics or billing — perfect for end-to-end dev validation.
     * The template should surface a visible banner so test bookings can't be
     * mistaken for real ones.
     */
    test_mode: boolean;
  };
  stripe_public_key: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/book/{slug}/properties
// ─────────────────────────────────────────────────────────────────────────────

export type Property = {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  image_url?: string | null;
  max_guests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities?: string[];
  /** Extra fields injected by the org config (branding overrides etc.). */
  [key: string]: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/book/{slug}/properties/{id}/availability
// ─────────────────────────────────────────────────────────────────────────────

export type AvailabilityCalendarDay = {
  date: string; // YYYY-MM-DD
  available: boolean;
  /** Reason if unavailable: 'booked' | 'blocked' | 'min_stay' | 'past' | … */
  reason?: string;
  /** Nightly price for this date (in the org currency, plain number). */
  price?: number;
  /** Minimum nights required to start a stay on this date. */
  min_stay?: number;
};

/**
 * The API returns the calendar as a flat array of days at `data` top-level
 * (not wrapped in `{ days: [...] }`). Mirror that shape directly so consumers
 * don't have to double-unwrap.
 */
export type AvailabilityCalendar = AvailabilityCalendarDay[];

/** @deprecated kept for back-compat of v0.1 consumers — prefer AvailabilityCalendar */
export type AvailabilityCalendarLegacy = {
  property_id: number;
  days: AvailabilityCalendarDay[];
  /** Months range covered by the calendar (YYYY-MM). */
  start_month?: string;
  end_month?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/book/{slug}/properties/{id}/price
// ─────────────────────────────────────────────────────────────────────────────

export type PriceQuoteRequest = {
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests_count?: number;
  coupon_code?: string;
};

export type PriceQuote = {
  nights: number;
  subtotal: number;
  total: number;
  nightly_average: number;
  cleaning_fee?: number;
  service_fee?: number;
  tourism_tax?: number;
  discount?: number;
  coupon?: {
    code: string;
    discount_amount: number;
    type: 'percent' | 'fixed';
  } | null;
  coupon_error?: string;
  currency?: string;
  [key: string]: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/book/{slug}/checkout
// ─────────────────────────────────────────────────────────────────────────────

export type CheckoutRequest = {
  property_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  message?: string;
  locale?: 'fr' | 'en';
  coupon_code?: string;
};

export type CheckoutResponse = {
  booking_token: string;
  payment_mode: 'full' | 'deposit' | 'request';
  total_amount: number;
  deposit_amount?: number;
  remaining_amount?: number;
  charge_amount?: number;
  client_secret?: string;
  stripe_public_key?: string | null;
  currency?: string;
  /** True if the booking was created against an engine in test mode. */
  is_test?: boolean;
  /**
   * True when test_mode_enabled + the org's Stripe key is live: the backend
   * skipped PaymentIntent creation entirely and auto-confirmed the booking
   * server-side. The client should jump straight to the confirmation screen
   * (no Stripe Elements, no "request" pending screen).
   */
  auto_confirmed_for_test?: boolean;
  /** Reservation id created when auto_confirmed_for_test is true. */
  reservation_id?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/book/{slug}/validate-coupon
// ─────────────────────────────────────────────────────────────────────────────

export type CouponValidationRequest = {
  code: string;
  property_id?: number;
  check_in?: string;
  check_out?: string;
  guests_count?: number;
};

export type CouponValidationResult = {
  valid: boolean;
  reason?: string;
  coupon?: {
    code: string;
    type: 'percent' | 'fixed';
    value: number;
  } | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/v1/book/{slug}/booking/{token}
// POST /api/v1/book/{slug}/booking/{token}/confirm
// ─────────────────────────────────────────────────────────────────────────────

export type BookingStatus = {
  token: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'declined' | string;
  payment_status: 'pending' | 'paid' | 'partial' | 'failed' | null;
  payment_mode: 'full' | 'deposit' | 'request';
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  deposit_amount?: number;
  remaining_amount?: number;
  currency?: string;
  property?: Pick<Property, 'id' | 'name' | 'image_url' | 'city' | 'country' | 'address'>;
  paid_at?: string | null;
  created_at?: string;
};
