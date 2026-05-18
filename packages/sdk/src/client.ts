import { StayCoreApiError } from './errors.js';
import type {
  ApiResponse,
  AvailabilityCalendar,
  BookingStatus,
  CheckoutRequest,
  CheckoutResponse,
  CouponValidationRequest,
  CouponValidationResult,
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
};

const DEFAULT_BASE_URL = 'https://api.stay-core.com/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;

function joinUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function toQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
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
    init?: { query?: Record<string, unknown>; body?: unknown },
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
  };
}
