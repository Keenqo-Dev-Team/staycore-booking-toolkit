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
| `/mentions-legales` `/cgv` `/privacy` | `LegalPage` | Stub legal pages — fill in your own copy |

## Stay'Core integration

All booking-engine calls go through `@staycore/booking-sdk/react`:

- `StayCoreProvider` (in `src/main.tsx`) provides the client to the tree.
- `useOrgConfig` — org name, payment mode, Stripe public key
- `useProperties` — list available bookable properties
- `useAvailability` — month calendar with `available` flags per day
- `usePrice` — live price quote based on date range + guests
- `useCheckout` — mutation to create a booking + Stripe PaymentIntent

## Customizing

1. **Branding** — edit `src/index.css` (CSS variables) and `tailwind.config.js`.
2. **Properties** — edit `src/data/properties.ts` (the CLI pre-fills it from the PMS).
3. **Pages** — every page lives in `src/pages/`. Add your own routes in `src/App.tsx`.
4. **SEO** — every page uses `<SeoHead>` to set title/meta. Property pages emit `LodgingBusiness` JSON-LD via `<JsonLd>`.

## License

MIT © [Keenqo](https://keenqo.fr) — Stay'Core
