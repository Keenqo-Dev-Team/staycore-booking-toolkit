# @staycore/booking-sdk

> TypeScript SDK for the **Stay'Core PMS** public booking engine API (v1).

[![npm](https://img.shields.io/npm/v/@staycore/booking-sdk)](https://www.npmjs.com/package/@staycore/booking-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Connect any web app (Vite / Next.js / Remix / Astro / vanilla browser / Node service / edge runtime) to the Stay'Core direct booking engine in a few lines.

---

## Install

```bash
pnpm add @staycore/booking-sdk
# or
npm install @staycore/booking-sdk
```

## Quickstart (vanilla)

```ts
import { createPmsClient } from '@staycore/booking-sdk';

const pms = createPmsClient({ orgSlug: 'mon-org' });

const config = await pms.config();
const properties = await pms.properties.list();
const price = await pms.price.compute(properties[0].id, {
  check_in: '2026-08-01',
  check_out: '2026-08-05',
  guests_count: 2,
});

const checkout = await pms.checkout.create({
  property_id: properties[0].id,
  guest_name: 'Jean Dupont',
  guest_email: 'jean@example.com',
  check_in: '2026-08-01',
  check_out: '2026-08-05',
  guests_count: 2,
});

// checkout.client_secret → Stripe Elements
```

## React hooks

```tsx
import {
  StayCoreProvider,
  useProperties,
  useAvailability,
  usePrice,
  useCheckout,
} from '@staycore/booking-sdk/react';

function App() {
  return (
    <StayCoreProvider orgSlug="mon-org">
      <Booking />
    </StayCoreProvider>
  );
}

function Booking() {
  const { data: properties, isLoading } = useProperties();
  // …
}
```

## API surface

```ts
pms.config()                                          // GET /book/{slug}
pms.properties.list()                                 // GET /book/{slug}/properties
pms.availability.get(propertyId)                      // GET /book/{slug}/properties/{id}/availability
pms.price.compute(propertyId, params)                 // GET /book/{slug}/properties/{id}/price?...
pms.checkout.create(payload)                          // POST /book/{slug}/checkout
pms.coupon.validate(payload)                          // POST /book/{slug}/validate-coupon
pms.booking.get(token)                                // GET /book/{slug}/booking/{token}
pms.booking.confirm(token)                            // POST /book/{slug}/booking/{token}/confirm

pms.options.list(propertyId, { check_in })            // GET /book/{slug}/properties/{id}/options

pms.chat.open({ property_id, locale })                // POST /book/{slug}/chat/sessions
pms.chat.send(token, content)                         // POST /book/{slug}/chat/messages
pms.chat.messages(token, { after })                   // GET /book/{slug}/chat/messages
pms.chat.saveContact(token, { name, email, phone })   // POST /book/{slug}/chat/contact-details

pms.contact.send({ name, email, message })            // POST /book/{slug}/contact

pms.giftCards.checkout(payload)                       // POST /book/{slug}/gift-cards/checkout
pms.giftCards.confirm(token)                          // POST /book/{slug}/gift-cards/{token}/confirm
pms.giftCards.get(token)                              // GET /book/{slug}/gift-cards/{token}
pms.giftCards.balance(code)                           // POST /book/{slug}/gift-cards/balance
```

## Options, gift cards and the quote

The price is never computed in the browser. Send the cart to `price.compute` each time it changes and display what the server returns:

```ts
const quote = await pms.price.compute(propertyId, {
  check_in: '2026-11-17',
  check_out: '2026-11-18',
  guests_count: 2,
  options: [{ id: 621, quantity: 1 }],
  gift_card_code: 'ABCD-EFGH-JKLM',
});

quote.total;            // value of the stay, options included
quote.gift_card_amount; // part paid by the gift card, or null
quote.amount_due;       // what will be charged online now
```

Pass the same `options` and `gift_card_code` to `checkout.create`. When the card covers everything, the response has `payment_required: false` and `status: 'confirmed'`: skip Stripe.

## Website chat

```tsx
import { useChat } from '@staycore/booking-sdk/react';

function ChatBubble({ open }: { open: boolean }) {
  const { messages, thread, send, saveContact, isSending } = useChat({ active: open, propertyId: 296 });
  // messages[i].role is 'visitor' | 'assistant' | 'host'
  // thread.status says who answers next: 'assistant' | 'awaiting_host' | 'host'
}
```

The chat is answered by the AI assistant the host configured in Stay'Core. Conversations land in the host's inbox, where a human can take over. The session opens on the first message and the visitor token is kept in `localStorage`; polling runs only while `active` is true. Read `config().modules` to know which modules the host enabled.

## Error handling

```ts
import { StayCoreApiError } from '@staycore/booking-sdk';

try {
  await pms.checkout.create(payload);
} catch (err) {
  if (err instanceof StayCoreApiError) {
    console.error(err.status, err.message, err.body);
    if (err.isClientError) /* show user error */;
  }
}
```

## Custom base URL / advanced options

```ts
createPmsClient({
  orgSlug: 'mon-org',
  baseUrl: 'https://api.stay-core.com/api/v1', // default
  timeoutMs: 30000,
  defaultHeaders: { 'Accept-Language': 'fr' },
  fetch: customFetch, // node < 18 / monkey-patched
});
```

## Versioning

The SDK targets `/api/v1/book/...` — a frozen, additive route group on the Stay'Core backend, guarded by [`BookingContractTest.php`](https://github.com/Keenqo-Dev-Team/staycore-pms/blob/develop/backend/tests/Feature/Api/V1/BookingContractTest.php).

Breaking changes would require `/api/v2/...` and a major version bump (`@staycore/booking-sdk@2.x`).

## License

MIT © [Keenqo](https://keenqo.fr) — Stay'Core
