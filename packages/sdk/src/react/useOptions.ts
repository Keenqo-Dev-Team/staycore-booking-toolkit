import { useStayCore } from './provider.js';
import { useAsync } from './useAsync.js';
import type { BookingOption } from '../types.js';

/**
 * Options sold on the booking page (early check-in, champagne…). Pass the
 * check-in date once it is known: an option past its lead time comes back
 * with `available: false` and the reason, rather than being hidden.
 */
export function useOptions(propertyId: number | null | undefined, checkIn?: string | null) {
  const client = useStayCore();
  return useAsync<BookingOption[]>(
    () => client.options.list(propertyId as number, checkIn ? { check_in: checkIn } : undefined),
    propertyId == null ? null : `options:${client.orgSlug}:${propertyId}:${checkIn ?? ''}`,
  );
}
