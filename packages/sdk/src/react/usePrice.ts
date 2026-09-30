import { useStayCore } from './provider.js';
import { useAsync } from './useAsync.js';
import type { PriceQuote, PriceQuoteRequest } from '../types.js';

export function usePrice(
  propertyId: number | null | undefined,
  params: PriceQuoteRequest | null,
) {
  const client = useStayCore();
  const enabled = propertyId != null && params != null && params.check_in && params.check_out;
  // The price is never computed in the browser: every input that can change it
  // is part of the key, so the quote is asked again from the server.
  const optionsKey = (params?.options ?? []).map((o) => `${o.id}x${o.quantity ?? 1}`).join(',');
  const key = enabled
    ? `price:${client.orgSlug}:${propertyId}:${params!.check_in}:${params!.check_out}:${params!.guests_count ?? ''}:${params!.adults_count ?? ''}:${params!.children_count ?? ''}:${params!.coupon_code ?? ''}:${optionsKey}:${params!.gift_card_code ?? ''}`
    : null;
  return useAsync<PriceQuote>(
    () => client.price.compute(propertyId as number, params as PriceQuoteRequest),
    key,
  );
}
