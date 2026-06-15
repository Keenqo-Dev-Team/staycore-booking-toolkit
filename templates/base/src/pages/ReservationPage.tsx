import { useEffect, useState } from 'react';
import { useStayCore } from '@staycore/booking-sdk/react';
import type { BookingStatus } from '@staycore/booking-sdk';
import { SeoHead } from '../components/common/SeoHead.tsx';
import { BRAND_NAME } from '../config.ts';
import { formatDate, formatPrice, toNumber } from '../lib/utils.ts';

type Props = {
  token: string;
};

export function ReservationPage({ token }: Props) {
  const pms = useStayCore();
  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    pms.booking
      .get(token)
      .then((b) => !cancelled && setBooking(b))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pms, token]);

  return (
    <>
      <SeoHead
        title={`Ma réservation — ${BRAND_NAME}`}
        description="Suivi de votre réservation."
      />
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading && <p className="text-center text-gray-600">Chargement…</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="font-medium text-red-900">Réservation introuvable</p>
            <p className="text-sm text-red-700 mt-2">{error}</p>
          </div>
        )}
        {booking && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <header>
              <p className="text-sm uppercase tracking-widest text-brand">
                Réservation {booking.status === 'confirmed' ? 'confirmée' : booking.status}
              </p>
              <h1 className="font-display text-3xl mt-2">Bonjour {booking.guest_name},</h1>
            </header>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <dt className="text-gray-500">Arrivée</dt>
              <dd className="text-gray-900 font-medium">{formatDate(booking.check_in)}</dd>
              <dt className="text-gray-500">Départ</dt>
              <dd className="text-gray-900 font-medium">{formatDate(booking.check_out)}</dd>
              <dt className="text-gray-500">Voyageurs</dt>
              <dd className="text-gray-900 font-medium">{booking.guests_count}</dd>
              <dt className="text-gray-500">Total payé</dt>
              <dd className="text-gray-900 font-medium">
                {formatPrice(toNumber(booking.total_amount))}
              </dd>
              <dt className="text-gray-500">Statut paiement</dt>
              <dd className="text-gray-900 font-medium">{booking.payment_status ?? 'en attente'}</dd>
            </dl>

            <p className="text-sm text-gray-600 pt-4 border-t border-gray-100">
              Un email récapitulatif vous a été envoyé. Pour toute question, contactez-nous directement.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
