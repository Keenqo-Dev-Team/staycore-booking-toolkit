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
  /**
   * Modules the org enabled for its website (chat, contact form, gift cards).
   * Absent on backends older than the modules release — treat as all disabled.
   */
  modules?: WebsiteModules;
};

export type WebsiteModules = {
  chat: {
    enabled: boolean;
    welcome_message_fr: string | null;
    welcome_message_en: string | null;
  };
  contact: { enabled: boolean };
  gift_cards: {
    enabled: boolean;
    /** Amounts the host proposes, in the org currency. */
    amounts: number[];
    allow_custom_amount: boolean;
    min_amount: number;
    max_amount: number;
    validity_months: number;
    currency: string;
  };
  /** Present when the backend requires a captcha token on chat/contact. */
  captcha: { provider: 'turnstile'; site_key: string } | null;
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

/** One option of the cart: the catalog id and a quantity (default 1). */
export type OptionSelection = { id: number; quantity?: number };

export type PriceQuoteRequest = {
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests_count?: number;
  /** Adultes assujettis à la taxe de séjour (mineurs exonérés). */
  adults_count?: number;
  /** Enfants (-18 ans), exonérés de taxe de séjour. */
  children_count?: number;
  coupon_code?: string;
  /** Options picked by the guest. Priced by the server, never by the client. */
  options?: OptionSelection[];
  /** Gift card to pay with. A means of payment: `total` is unchanged, `amount_due` drops. */
  gift_card_code?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/book/{slug}/properties/{id}/options
// ─────────────────────────────────────────────────────────────────────────────

export type BookingOption = {
  id: number;
  name: string;
  description: string | null;
  type: 'standard' | 'early_check_in' | 'late_check_out';
  /** Guaranteed time for early check-in / late check-out, e.g. "16:00". */
  available_time: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  /** `instant`: charged with the stay. `on_request`: charged only once the host agrees. */
  fulfillment_mode: 'instant' | 'on_request';
  max_quantity: number;
  lead_time_hours: number | null;
  /** False when the option can no longer be ordered for the given check-in. */
  available: boolean;
  unavailable_reason: string | null;
};

/** An option line as priced by the server in a quote or a booking. */
export type PricedOption = {
  property_upsell_id: number;
  name: string;
  type: BookingOption['type'];
  available_time: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  fulfillment_mode: BookingOption['fulfillment_mode'];
};

/**
 * Détail du calcul de la taxe de séjour renvoyé par le backend (mode/régime,
 * tarif par personne et par nuit, plafond appliqué, etc.). Informatif —
 * pratique pour afficher « X €/pers/nuit × N adultes × P nuits ».
 */
export type TourismTaxDetail = {
  mode?: 'flat' | 'auto' | 'manual';
  source?: string;
  regime?: 'reel' | 'proportionnel';
  per_person_night?: number;
  percentage?: number;
  cap_applied?: boolean;
  taxable_persons?: number;
  nights?: number;
  [key: string]: unknown;
};

export type PriceQuote = {
  nights: number;
  subtotal: number;
  total: number;
  nightly_average: number;
  cleaning_fee?: number;
  service_fee?: number;
  tourism_tax?: number;
  tourism_tax_detail?: TourismTaxDetail;
  discount?: number;
  coupon?: {
    code: string;
    discount_amount: number;
    type: 'percent' | 'fixed';
  } | null;
  coupon_error?: string;
  currency?: string;
  /** Options kept by the server, priced. */
  options?: PricedOption[];
  /** Options charged with the stay — included in `total`. */
  options_total?: number;
  /** Options awaiting the host's approval — NOT in `total`. */
  options_on_request_total?: number;
  options_errors?: string[];
  /** The stay alone, options excluded. */
  stay_total?: number;
  fees?: { id: number; name: string; description: string | null; amount: number; label: string }[];
  fees_total?: number;
  payment_mode?: 'full' | 'deposit' | 'request';
  deposit_amount?: number | null;
  /** Part of `total` paid by the gift card, or null when none applies. */
  gift_card_amount?: number | null;
  gift_card?: {
    code: string;
    applied_amount: number;
    /** What stays on the card after this booking. */
    remaining_balance: number;
    expires_at: string | null;
  } | null;
  /** Why the gift card was not applied (unknown code, expired, empty…). */
  gift_card_error?: string;
  /** What will be charged online now, gift card deducted. */
  amount_due?: number;
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
  /** Adultes assujettis à la taxe de séjour (mineurs exonérés). */
  adults_count?: number;
  /** Enfants (-18 ans), exonérés de taxe de séjour. */
  children_count?: number;
  message?: string;
  locale?: 'fr' | 'en';
  coupon_code?: string;
  options?: OptionSelection[];
  gift_card_code?: string;
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
  /**
   * False when nothing is left to charge (a gift card or a coupon covered
   * everything): the booking is already confirmed, skip Stripe.
   */
  payment_required?: boolean;
  /** `confirmed` when the booking was confirmed without payment. */
  status?: string;
  options?: PricedOption[];
  options_amount?: number;
  options_on_request_amount?: number;
  /** Part of the total paid by the gift card. */
  gift_card_amount?: number | null;
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
  /** Options of the booking; `approval_status` tells where an on-request option stands. */
  options?: (Partial<PricedOption> & {
    name: string;
    approval_status?: 'not_required' | 'pending' | 'approved' | 'declined';
  })[];
  options_amount?: number;
  gift_card_amount?: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Website chat — /api/v1/book/{slug}/chat/*
// ─────────────────────────────────────────────────────────────────────────────

export type ChatSessionRequest = {
  /** Property the visitor is looking at. The host's assistant is set per property. */
  property_id?: number;
  locale?: 'fr' | 'en';
  /** Page the chat was opened from; used in the "continue on the website" email link. */
  origin_url?: string;
  name?: string;
  email?: string;
  /** Turnstile token, required when `modules.captcha` is set. */
  captcha_token?: string;
};

export type ChatMessage = {
  id: number;
  /** `assistant`: the host's AI assistant. `host`: a human from the host's team. */
  role: 'visitor' | 'assistant' | 'host';
  content: string;
  sent_at: string | null;
};

export type ChatThreadState = {
  /**
   * Who answers next:
   * - `assistant`: the AI assistant replies on its own;
   * - `awaiting_host`: the assistant drafts, the host approves before sending;
   * - `host`: a human has taken over (or no assistant is available).
   */
  status: 'assistant' | 'awaiting_host' | 'host';
  assistant_available: boolean;
  /** True once the visitor left an email: replies reach them even offline. */
  has_contact: boolean;
  kind: 'chat' | 'contact';
};

export type ChatSession = {
  /** Visitor token. Keep it (localStorage) to resume the conversation. */
  token: string;
  welcome_message: string | null;
  thread: ChatThreadState;
  messages: ChatMessage[];
};

export type ChatSendResult = { message: ChatMessage; thread: ChatThreadState };

export type ChatMessagesResult = { messages: ChatMessage[]; thread: ChatThreadState };

export type ChatContactDetails = { name?: string; email?: string; phone?: string };

// ─────────────────────────────────────────────────────────────────────────────
// Contact form — POST /api/v1/book/{slug}/contact
// ─────────────────────────────────────────────────────────────────────────────

export type ContactRequest = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  property_id?: number;
  locale?: 'fr' | 'en';
  origin_url?: string;
  captcha_token?: string;
  /** Honeypot: leave empty. A hidden field bots fill in. */
  website?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Gift cards — /api/v1/book/{slug}/gift-cards/*
// ─────────────────────────────────────────────────────────────────────────────

export type GiftCardCheckoutRequest = {
  amount: number;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name?: string;
  /** When set, the card is emailed to the recipient; otherwise to the purchaser. */
  recipient_email?: string;
  message?: string;
  /** YYYY-MM-DD. Delivery date chosen by the purchaser; immediate when omitted. */
  send_at?: string;
  locale?: 'fr' | 'en';
};

export type GiftCardCheckoutResponse = {
  gift_card_token: string;
  amount: number;
  currency: string;
  client_secret?: string;
  stripe_public_key?: string | null;
  is_test?: boolean;
  /** Test mode on a live Stripe key: no payment, the card is active right away. */
  auto_confirmed_for_test?: boolean;
  status?: string;
};

export type GiftCardStatus = {
  token: string;
  status: 'pending_payment' | 'active' | 'disabled' | 'cancelled';
  amount: number;
  currency: string;
  /** The code to redeem. Null until the card is paid. */
  code: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  send_at: string | null;
  delivered_at: string | null;
  expires_at: string | null;
  is_test: boolean;
};

export type GiftCardBalance =
  | { valid: true; balance: number; currency: string; expires_at: string | null }
  | { valid: false; message: string };
