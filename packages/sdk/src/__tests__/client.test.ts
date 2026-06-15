import { describe, expect, it, vi } from 'vitest';
import { createPmsClient, StayCoreApiError } from '../index.js';

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  return vi.fn(impl) as unknown as typeof globalThis.fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createPmsClient', () => {
  it('requires an orgSlug', () => {
    // @ts-expect-error testing runtime guard
    expect(() => createPmsClient({})).toThrow(/orgSlug/);
  });

  it('hits GET /book/{slug} for config()', async () => {
    const fetchFn = mockFetch(async (url) => {
      expect(url).toBe('https://api.stay-core.com/api/v1/book/acme');
      return jsonResponse({
        success: true,
        data: {
          organization: { name: 'Acme', slug: 'acme', logo: null },
          config: {
            payment_mode: 'full',
            default_locale: 'fr',
            branding: null,
            terms_url: null,
            min_stay_nights: null,
            max_stay_nights: null,
            test_mode: false,
          },
          stripe_public_key: 'pk_test_xxx',
        },
      });
    });

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });
    const config = await client.config();

    expect(config.organization.slug).toBe('acme');
    expect(config.stripe_public_key).toBe('pk_test_xxx');
    expect(config.config.test_mode).toBe(false);
  });

  it('surfaces config.test_mode = true when the engine is in test mode', async () => {
    const fetchFn = mockFetch(async () =>
      jsonResponse({
        success: true,
        data: {
          organization: { name: 'Acme', slug: 'acme', logo: null },
          config: {
            payment_mode: 'full',
            default_locale: 'fr',
            branding: null,
            terms_url: null,
            min_stay_nights: null,
            max_stay_nights: null,
            test_mode: true,
          },
          stripe_public_key: 'pk_test_xxx',
        },
      }),
    );

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });
    const config = await client.config();
    expect(config.config.test_mode).toBe(true);
  });

  it('serializes query params for price.compute', async () => {
    const fetchFn = mockFetch(async (url) => {
      expect(url).toContain('/properties/42/price?');
      expect(url).toContain('check_in=2026-08-01');
      expect(url).toContain('check_out=2026-08-05');
      expect(url).toContain('guests_count=2');
      return jsonResponse({
        success: true,
        data: { nights: 4, subtotal: 400, total: 400, nightly_average: 100 },
      });
    });

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });
    const price = await client.price.compute(42, {
      check_in: '2026-08-01',
      check_out: '2026-08-05',
      guests_count: 2,
    });

    expect(price.nights).toBe(4);
    expect(price.total).toBe(400);
  });

  it('serializes adults_count / children_count for the tourist-tax breakdown', async () => {
    const fetchFn = mockFetch(async (url) => {
      expect(url).toContain('adults_count=2');
      expect(url).toContain('children_count=1');
      return jsonResponse({
        success: true,
        data: {
          nights: 3,
          subtotal: 300,
          total: 306.6,
          nightly_average: 100,
          tourism_tax: 6.6,
          tourism_tax_detail: { mode: 'auto', regime: 'reel', per_person_night: 1.1, taxable_persons: 2 },
        },
      });
    });

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });
    const price = await client.price.compute(42, {
      check_in: '2026-08-01',
      check_out: '2026-08-04',
      guests_count: 3,
      adults_count: 2,
      children_count: 1,
    });

    expect(price.tourism_tax).toBe(6.6);
    expect(price.tourism_tax_detail?.regime).toBe('reel');
  });

  it('throws StayCoreApiError on success:false envelope', async () => {
    const fetchFn = mockFetch(async () =>
      jsonResponse({ success: false, message: 'Non disponible.' }, 422),
    );

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });

    await expect(
      client.price.compute(1, { check_in: '2026-01-01', check_out: '2026-01-02' }),
    ).rejects.toMatchObject({
      name: 'StayCoreApiError',
      status: 422,
      message: 'Non disponible.',
    });
  });

  it('encodes booking tokens in URL paths', async () => {
    const fetchFn = mockFetch(async (url) => {
      expect(url).toContain('/booking/abc%20def');
      return jsonResponse({
        success: true,
        data: {
          token: 'abc def',
          status: 'confirmed',
          payment_status: 'paid',
          payment_mode: 'full',
          guest_name: 'Jean',
          guest_email: 'jean@example.com',
          check_in: '2026-08-01',
          check_out: '2026-08-05',
          guests_count: 2,
          total_amount: 400,
        },
      });
    });

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });
    const booking = await client.booking.get('abc def');
    expect(booking.token).toBe('abc def');
  });

  it('throws a clear error on network failure', async () => {
    const fetchFn = mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const client = createPmsClient({ orgSlug: 'acme', fetch: fetchFn });

    await expect(client.properties.list()).rejects.toBeInstanceOf(StayCoreApiError);
  });
});
