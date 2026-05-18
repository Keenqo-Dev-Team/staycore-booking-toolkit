# @staycore/booking-sdk

> TypeScript SDK for the Stay'Core PMS public booking engine API (v1).

## Install

```bash
pnpm add @staycore/booking-sdk
# or
npm install @staycore/booking-sdk
```

## Usage

```ts
import { createPmsClient } from '@staycore/booking-sdk';

const pms = createPmsClient({
  orgSlug: 'mon-org',
  baseUrl: 'https://api.stay-core.com/api/v1', // optional, default
});

const properties = await pms.properties.list();
const price = await pms.price.compute(propertyId, { checkIn, checkOut, guests: 2 });
```

## React hooks

```tsx
import { useAvailability, usePrice } from '@staycore/booking-sdk/react';
```

See full documentation: https://docs.stay-core.com/booking-toolkit
