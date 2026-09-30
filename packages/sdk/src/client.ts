import { StayCoreApiError } from './errors.js';
import type {
  ApiResponse,
  AvailabilityCalendar,
  BookingOption,
  BookingStatus,
  ChatContactDetails,
  ChatMessagesResult,
  ChatSendResult,
  ChatSession,
  ChatSessionRequest,
  ChatThreadState,
  CheckoutRequest,
  CheckoutResponse,
  ContactRequest,
  CouponValidationRequest,
  CouponValidationResult,
  GiftCardBalance,
  GiftCardCheckoutRequest,
  GiftCardCheckoutResponse,
  GiftCardStatus,
  OrgConfig,
  PriceQuote,
  PriceQuoteRequest,
  Property,
} from './types.js';

export type StayCoreClientOptions = {
  /** Organization slug as registered in the Stay'Core PMS. */
  orgSlug: string;
  /** Override the API base URL. Default: `https://api.stay-core.com/api/v1`. */
  baseUrl?: string;
  /**
   * Optional `fetch` implementation. Falls back to globalThis.fetch (Node 20+,
   * all browsers, Cloudflare Workers, Vercel Edge, etc.).
   */
  fetch?: typeof globalThis.fetch;
  /** Extra headers attached to every request (e.g. `Accept-Language`). */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in milliseconds. Default: 15000. */
  timeoutMs?: number;
};

export type StayCoreClient = {
  readonly orgSlug: string;
  readonly baseUrl: string;
  config: () => Promise<OrgConfig>;
  properties: {
    list: () => Promise<Property[]>;
  };
  availability: {
    get: (propertyId: number) => Promise<AvailabilityCalendar>;
  };
  options: {
    /** Options sold on the booking page. Pass `check_in` to evaluate lead times. */
    list: (propertyId: number, params?: { check_in?: string }) => Promise<BookingOption[]>;
  };
  price: {
    compute: (propertyId: number, params: PriceQuoteRequest) => Promise<PriceQuote>;
  };
  checkout: {
    create: (payload: CheckoutRequest) => Promise<CheckoutResponse>;
  };
  coupon: {
    validate: (payload: CouponValidationRequest) => Promise<CouponValidationResult>;
  };
  booking: {
    get: (token: string) => Promise<BookingStatus>;
    confirm: (token: string) => Promise<BookingStatus>;
  };
  /**
   * Website chat, answered by the AI assistant the host configured in
   * Stay'Core. Conversations land in the host's inbox, where a human can take
   * over at any time. There is no websocket: poll `messages()` while the chat
   * is open (see the `useChat` React hook).
   */
  chat: {
    open: (payload?: ChatSessionRequest) => Promise<ChatSession>;
    send: (token: string, content: string) => Promise<ChatSendResult>;
    /** Messages after the given id (omit for the whole conversation), plus who answers next. */
    messages: (token: string, params?: { after?: number }) => Promise<ChatMessagesResult>;
    /** Lets the host reach the visitor by email once they have left the site. */
    saveContact: (token: string, details: ChatContactDetails) => Promise<{ thread: ChatThreadState }>;
  };
  contact: {
    /** Contact form. The message opens a thread in the host's inbox; the reply comes by email. */
    send: (payload: ContactRequest) => Promise<{ received: boolean }>;
  };
  giftCards: {
    /** Creates the pending card and its PaymentIntent on the host's Stripe account. */
    checkout: (payload: GiftCardCheckoutRequest) => Promise<GiftCardCheckoutResponse>;
    /** Call after Stripe succeeded: the server re-checks the payment and activates the card. */
    confirm: (token: string) => Promise<GiftCardStatus>;
    get: (token: string) => Promise<GiftCardStatus>;
    /** Balance of a card, by the code printed on it. */
    balance: (code: string) => Promise<GiftCardBalance>;
  };
};

const DEFAULT_BASE_URL = 'https://api.stay-core.com/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;

function joinUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Serializes query params. Arrays of objects use the bracket form the backend
 * expects: `options[0][id]=42&options[0][quantity]=1`.
 */
function toQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          for (const [field, fieldValue] of Object.entries(item as Record<string, unknown>)) {
            if (fieldValue !== undefined && fieldValue !== null) {
              search.set(`${key}[${index}][${field}]`, String(fieldValue));
            }
          }
        } else if (item !== undefined && item !== null) {
          search.set(`${key}[${index}]`, String(item));
        }
      });
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export function createPmsClient(options: StayCoreClientOptions): StayCoreClient {
  if (!options.orgSlug) {
    throw new Error('createPmsClient: orgSlug is required.');
  }

  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const fetchFn = options.fetch ?? globalThis.fetch;
  if (!fetchFn) {
    throw new Error(
      'createPmsClient: no fetch implementation found. Pass options.fetch on Node <18.',
    );
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const orgPath = `/book/${encodeURIComponent(options.orgSlug)}`;

  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    init?: { query?: Record<string, unknown>; body?: unknown; headers?: Record<string, string> },
  ): Promise<T> {
    const url = joinUrl(baseUrl, `${orgPath}${path}${toQueryString(init?.query)}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchFn(url, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.defaultHeaders,
          ...init?.headers,
        },
        body: init?.body ? JSON.stringify(init.body) : undefined,
      });
    } catch (err) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : 'Network error';
      throw new StayCoreApiError(message, 0, null, `${method} ${path}`);
    }
    clearTimeout(timer);

    let body: ApiResponse<T> | null = null;
    try {
      body = (await response.json()) as ApiResponse<T>;
    } catch {
      // Body is not JSON — keep `body` null.
    }

    if (!response.ok || !body || body.success === false) {
      const message =
        body && 'message' in body && body.message
          ? body.message
          : `HTTP ${response.status} on ${method} ${path}`;
      throw new StayCoreApiError(message, response.status, body, `${method} ${path}`);
    }

    return body.data;
  }

  /** The visitor token travels as a bearer token: never in the URL, where it would be logged. */
  const visitor = (token: string) => ({ Authorization: `Bearer ${token}` });

  return {
    orgSlug: options.orgSlug,
    baseUrl,

    config: () => request<OrgConfig>('GET', ''),

    properties: {
      list: () => request<Property[]>('GET', '/properties'),
    },

    availability: {
      get: (propertyId) =>
        request<AvailabilityCalendar>('GET', `/properties/${propertyId}/availability`),
    },

    options: {
      list: (propertyId, params) =>
        request<BookingOption[]>('GET', `/properties/${propertyId}/options`, { query: params }),
    },

    price: {
      compute: (propertyId, params) =>
        request<PriceQuote>('GET', `/properties/${propertyId}/price`, { query: params }),
    },

    checkout: {
      create: (payload) => request<CheckoutResponse>('POST', '/checkout', { body: payload }),
    },

    coupon: {
      validate: (payload) =>
        request<CouponValidationResult>('POST', '/validate-coupon', { body: payload }),
    },

    booking: {
      get: (token) =>
        request<BookingStatus>('GET', `/booking/${encodeURIComponent(token)}`),
      confirm: (token) =>
        request<BookingStatus>('POST', `/booking/${encodeURIComponent(token)}/confirm`),
    },

    chat: {
      open: (payload) => request<ChatSession>('POST', '/chat/sessions', { body: payload ?? {} }),
      send: (token, content) =>
        request<ChatSendResult>('POST', '/chat/messages', { body: { content }, headers: visitor(token) }),
      messages: (token, params) =>
        request<ChatMessagesResult>('GET', '/chat/messages', { query: params, headers: visitor(token) }),
      saveContact: (token, details) =>
        request<{ thread: ChatThreadState }>('POST', '/chat/contact-details', {
          body: details,
          headers: visitor(token),
        }),
    },

    contact: {
      send: (payload) => request<{ received: boolean }>('POST', '/contact', { body: payload }),
    },

    giftCards: {
      checkout: (payload) =>
        request<GiftCardCheckoutResponse>('POST', '/gift-cards/checkout', { body: payload }),
      confirm: (token) =>
        request<GiftCardStatus>('POST', `/gift-cards/${encodeURIComponent(token)}/confirm`),
      get: (token) => request<GiftCardStatus>('GET', `/gift-cards/${encodeURIComponent(token)}`),
      balance: (code) => request<GiftCardBalance>('POST', '/gift-cards/balance', { body: { code } }),
    },
  };
}
