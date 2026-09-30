import { describe, expect, it, vi } from 'vitest';
import { createPmsClient } from '../index.js';

type Call = { url: string; init?: RequestInit };

/** A fetch double that records each call and answers with the given data. */
function recorder(data: unknown, status = 200) {
  const calls: Call[] = [];
  const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ success: status < 400, data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof globalThis.fetch;

  return { calls, client: createPmsClient({ orgSlug: 'kss', fetch: fetchFn }) };
}

const header = (call: Call, name: string) => (call.init?.headers as Record<string, string>)[name];

describe('options', () => {
  it('lists the options of a property, with the check-in when given', async () => {
    const { calls, client } = recorder([{ id: 621, name: 'Champagne', price: 50 }]);

    const options = await client.options.list(296, { check_in: '2026-11-17' });

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/properties/296/options?check_in=2026-11-17');
    expect(options[0].name).toBe('Champagne');
  });

  it('sends the selected options to the quote in bracket form', async () => {
    const { calls, client } = recorder({ nights: 1, subtotal: 269, total: 354, nightly_average: 269 });

    await client.price.compute(296, {
      check_in: '2026-11-17',
      check_out: '2026-11-18',
      guests_count: 2,
      options: [{ id: 621, quantity: 1 }, { id: 619 }],
      gift_card_code: 'ABCD-EFGH-JKLM',
    });

    const query = decodeURIComponent(new URL(calls[0].url).search);
    expect(query).toContain('options[0][id]=621');
    expect(query).toContain('options[0][quantity]=1');
    expect(query).toContain('options[1][id]=619');
    expect(query).not.toContain('options[1][quantity]');
    expect(query).toContain('gift_card_code=ABCD-EFGH-JKLM');
  });

  it('leaves the quote URL untouched when no option is selected', async () => {
    const { calls, client } = recorder({ nights: 1, subtotal: 269, total: 269, nightly_average: 269 });

    await client.price.compute(296, { check_in: '2026-11-17', check_out: '2026-11-18', options: [] });

    expect(calls[0].url).toBe(
      'https://api.stay-core.com/api/v1/book/kss/properties/296/price?check_in=2026-11-17&check_out=2026-11-18',
    );
  });
});

describe('chat', () => {
  it('opens a session and returns the visitor token', async () => {
    const { calls, client } = recorder({
      token: '01jabc.secret',
      welcome_message: 'Bonjour',
      thread: { status: 'assistant', assistant_available: true, has_contact: false, kind: 'chat' },
      messages: [],
    });

    const session = await client.chat.open({ property_id: 296, locale: 'fr' });

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/chat/sessions');
    expect(calls[0].init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ property_id: 296, locale: 'fr' });
    expect(session.token).toBe('01jabc.secret');
  });

  it('carries the visitor token as a bearer header, never in the URL', async () => {
    const { calls, client } = recorder({
      message: { id: 7, role: 'visitor', content: 'Bonjour', sent_at: null },
      thread: { status: 'assistant', assistant_available: true, has_contact: false, kind: 'chat' },
    });

    await client.chat.send('01jabc.secret', 'Bonjour');

    expect(header(calls[0], 'Authorization')).toBe('Bearer 01jabc.secret');
    expect(calls[0].url).not.toContain('secret');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ content: 'Bonjour' });
  });

  it('polls only the messages after the given id', async () => {
    const { calls, client } = recorder({
      messages: [{ id: 9, role: 'assistant', content: 'Oui.', sent_at: null }],
      thread: { status: 'assistant', assistant_available: true, has_contact: false, kind: 'chat' },
    });

    const result = await client.chat.messages('01jabc.secret', { after: 8 });

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/chat/messages?after=8');
    expect(calls[0].init?.method).toBe('GET');
    expect(header(calls[0], 'Authorization')).toBe('Bearer 01jabc.secret');
    expect(result.messages[0].role).toBe('assistant');
  });

  it('saves the contact details of the visitor', async () => {
    const { calls, client } = recorder({
      thread: { status: 'host', assistant_available: false, has_contact: true, kind: 'chat' },
    });

    const result = await client.chat.saveContact('01jabc.secret', { email: 'jeanne@example.com' });

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/chat/contact-details');
    expect(result.thread.has_contact).toBe(true);
  });
});

describe('contact', () => {
  it('posts the contact form', async () => {
    const { calls, client } = recorder({ received: true });

    const result = await client.contact.send({ name: 'Sophie', email: 'sophie@example.com', message: 'Bonjour' });

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/contact');
    expect(result.received).toBe(true);
  });
});

describe('giftCards', () => {
  it('creates the pending card and returns what Stripe needs', async () => {
    const { calls, client } = recorder({
      gift_card_token: 'tok123',
      amount: 200,
      currency: 'EUR',
      client_secret: 'pi_secret',
      stripe_public_key: 'pk_test_x',
    });

    const checkout = await client.giftCards.checkout({
      amount: 200,
      purchaser_name: 'Benoît',
      purchaser_email: 'benoit@example.com',
      recipient_email: 'sophie@example.com',
    });

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/gift-cards/checkout');
    expect(checkout.client_secret).toBe('pi_secret');
  });

  it('confirms and reads a card by its purchase token', async () => {
    const { calls, client } = recorder({ token: 'tok 123', status: 'active', amount: 200, code: 'ABCD-EFGH-JKLM' });

    const confirmed = await client.giftCards.confirm('tok 123');
    await client.giftCards.get('tok 123');

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/gift-cards/tok%20123/confirm');
    expect(calls[0].init?.method).toBe('POST');
    expect(calls[1].url).toBe('https://api.stay-core.com/api/v1/book/kss/gift-cards/tok%20123');
    expect(confirmed.code).toBe('ABCD-EFGH-JKLM');
  });

  it('looks a balance up by code, in the body rather than the URL', async () => {
    const { calls, client } = recorder({ valid: true, balance: 31, currency: 'EUR', expires_at: '2027-09-30' });

    const balance = await client.giftCards.balance('ABCD-EFGH-JKLM');

    expect(calls[0].url).toBe('https://api.stay-core.com/api/v1/book/kss/gift-cards/balance');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ code: 'ABCD-EFGH-JKLM' });
    expect(balance.valid && balance.balance).toBe(31);
  });
});
