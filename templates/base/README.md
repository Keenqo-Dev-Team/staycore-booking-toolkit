# @staycore/template-base

> Canonical Vite + React + TypeScript + Tailwind template wired to `@staycore/booking-sdk`.

This template is **not** meant to be installed directly. It is consumed by:

- [`create-staycore-site`](../../packages/create-staycore-site) (the npx CLI)
- [`staycore-direct-booking`](../../packages/skill-claude-code) (the Claude Code Skill)

Both replace the `{{PLACEHOLDERS}}` (`{{BRAND_NAME}}`, `{{BRAND_TAGLINE}}`, `{{PMS_ORG_SLUG}}`, `{{GA4_MEASUREMENT_ID}}`, `{{PROPERTIES_PLACEHOLDER}}`) with values you provide at scaffold time, and overlay one of the [4 presets](../presets) on top of `src/index.css`.

## Pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `HomePage` | Hero + featured properties + trust signals |
| `/properties` | `PropertiesPage` | List of all bookable properties |
| `/properties/:slug` | `PropertyDetailPage` | Single property page (gallery, amenities, CTA) |
| `/reserver` | `BookingPage` | Booking flow (form → Stripe → confirmation) |
| `/reservation/:token` | `ReservationPage` | Self-service booking tracking |
| `/contact` | `ContactPage` | Contact form, delivered to the host's Stay'Core inbox (module `contact`) |
| `/carte-cadeau` | `GiftCardPage` | Gift card purchase + balance lookup (module `gift_cards`) |
| `/carte-cadeau/confirmation/:token` | `GiftCardConfirmationPage` | Gift card receipt, with its code |
| `/mentions-legales` `/cgv` `/privacy` | `LegalPage` | Stub legal pages — fill in your own copy |

## Stay'Core integration

All booking-engine calls go through `@staycore/booking-sdk/react`:

- `StayCoreProvider` (in `src/main.tsx`) provides the client to the tree.
- `useOrgConfig` — org name, payment mode, Stripe public key
- `useProperties` — list available bookable properties
- `useAvailability` — month calendar with `available` flags per day
- `usePrice` — live price quote based on date range + guests
- `useCheckout` — mutation to create a booking + Stripe PaymentIntent
- `useChat` — website chat answered by the host's AI assistant (`ChatBubble`)
- `client.contact`, `client.giftCards` (through `useStayCore`) — contact form and gift cards

## Website modules

The chat bubble, the contact page and the gift card pages are **switched on by the host**, in Stay'Core under *Moteur de résa › Site web*. The site reads `modules` from the org config at load time and shows only what is enabled: nothing to redeploy when the host turns a module on or off.

- **Chat** — `ChatBubble` (mounted in `App.tsx`). The host's assistant answers; the conversation lands in the Stay'Core inbox, where a human can take over from the desktop or the mobile app. When the assistant sends a link to `/reserver?check_in=…&check_out=…`, the bubble turns it into a button and the booking form opens with those dates. Set the link in Stay'Core (*Site web › Lien de réservation de votre site*) to `https://your-site/reserver?check_in={check_in}&check_out={check_out}`.
- **Contact** — `ContactPage`. The message opens a thread in the host's inbox; the reply reaches the visitor by email.
- **Gift cards** — `GiftCardPage` sells a card on the host's Stripe account; `BookingForm` takes the code as a means of payment (the quote shows what the card covers and what is left to pay).

## Customizing

1. **Branding** — edit `src/index.css` (CSS variables) and `tailwind.config.js`.
2. **Properties** — edit `src/data/properties.ts` (the CLI pre-fills it from the PMS).
3. **Pages** — every page lives in `src/pages/`. Add your own routes in `src/App.tsx`.
4. **SEO** — every page uses `<SeoHead>` to set title/meta. Property pages emit `LodgingBusiness` JSON-LD via `<JsonLd>`.

## License

MIT © [Keenqo](https://keenqo.fr) — Stay'Core
