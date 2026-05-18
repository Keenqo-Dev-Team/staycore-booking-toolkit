import { useOrgConfig } from '@staycore/booking-sdk/react';

/**
 * Sticky banner shown on every page when the org has enabled "test mode"
 * in its Stay'Core dashboard. Test bookings created from this site don't
 * lock the calendar, don't propagate to Channex, and are excluded from
 * analytics — but a clearly visible banner is mandatory so a real guest
 * landing on the site never makes a fake reservation by mistake.
 *
 * Hidden automatically when the engine is not in test mode (no flash on
 * load: the banner only mounts after the first /config response arrives).
 */
export function TestModeBanner() {
  const { data, isLoading } = useOrgConfig();
  if (isLoading || !data?.config.test_mode) return null;

  return (
    <div
      role="status"
      aria-label="Site en mode test"
      className="sticky top-0 z-50 w-full bg-amber-400 text-amber-950 text-sm font-medium text-center py-2 px-4"
    >
      <span aria-hidden>🧪</span>{' '}
      Mode test actif — les réservations effectuées ici sont fictives, aucune nuit n'est bloquée.
    </div>
  );
}
