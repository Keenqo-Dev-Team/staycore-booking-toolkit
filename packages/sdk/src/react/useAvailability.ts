import { useStayCore } from './provider.js';
import { useAsync } from './useAsync.js';
import type { AvailabilityCalendar } from '../types.js';

export function useAvailability(propertyId: number | null | undefined) {
  const client = useStayCore();
  return useAsync<AvailabilityCalendar>(
    () => client.availability.get(propertyId as number),
    propertyId == null ? null : `availability:${client.orgSlug}:${propertyId}`,
  );
}
