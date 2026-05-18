import { useStayCore } from './provider.js';
import { useAsync } from './useAsync.js';
import type { PriceQuote, PriceQuoteRequest } from '../types.js';

export function usePrice(
  propertyId: number | null | undefined,
  params: PriceQuoteRequest | null,
) {
  const client = useStayCore();
  const enabled = propertyId != null && params != null && params.check_in && params.check_out;
  const key = enabled
    ? `price:${client.orgSlug}:${propertyId}:${params!.check_in}:${params!.check_out}:${params!.guests_count ?? ''}:${params!.coupon_code ?? ''}`
    : null;
  return useAsync<PriceQuote>(
    () => client.price.compute(propertyId as number, params as PriceQuoteRequest),
    key,
  );
}
