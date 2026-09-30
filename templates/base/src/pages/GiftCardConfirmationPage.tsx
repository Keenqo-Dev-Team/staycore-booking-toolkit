import { useEffect, useState } from 'react';
import { StayCoreApiError } from '@staycore/booking-sdk';
import type { GiftCardStatus } from '@staycore/booking-sdk';
import { useStayCore } from '@staycore/booking-sdk/react';
import { SeoHead } from '../components/common/SeoHead.tsx';
import { BRAND_NAME } from '../config.ts';
import { formatDate, formatPrice } from '../lib/utils.ts';

type Props = {
  token: string;
  onNavigate: (path: string) => void;
};

/**
 * What follows a gift card purchase. When the payment just went through but
 * the card is not active yet (back from the bank, tab reloaded), the
 * confirmation is retried here.
 */
export function GiftCardConfirmationPage({ token, onNavigate }: Props) {
  const pms = useStayCore();
  const [card, setCard] = useState<GiftCardStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let current = await pms.giftCards.get(token);
        if (current.status === 'pending_payment') {
          try {
            current = await pms.giftCards.confirm(token);
          } catch (confirmError) {
            // 422: Stripe has not charged (yet). Show the wait rather than an error.
            if (!(confirmError instanceof StayCoreApiError) || confirmError.status !== 422) throw confirmError;
          }
        }
        if (!cancelled) setCard(current);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Carte cadeau introuvable.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pms, token]);

  const scheduled = card?.send_at && !card.delivered_at;

  return (
    <>
      <SeoHead title={`Votre carte cadeau — ${BRAND_NAME}`} description="Confirmation de votre carte cadeau." />

      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!card && !error && <p className="text-center text-gray-600">Chargement…</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="font-medium text-red-900">Carte cadeau introuvable</p>
            <p className="text-sm text-red-700 mt-2">
              {error} Si vous venez de payer, contactez-nous : nous vérifions tout de suite.
            </p>
          </div>
        )}

        {card && card.status !== 'active' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h1 className="font-display text-3xl mb-3">
              {card.status === 'pending_payment' ? 'Paiement en cours de validation' : "Cette carte cadeau n'est pas active"}
            </h1>
            <p className="text-gray-700 mb-6">
              {card.status === 'pending_payment'
                ? "Votre banque n'a pas encore validé le paiement. Rechargez cette page dans quelques instants ; la carte part dès que c'est confirmé."
                : "L'achat n'a pas abouti. Aucun montant n'a été débité."}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/carte-cadeau')}
              className="inline-flex items-center px-6 py-3 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark transition-colors"
            >
              Retour aux cartes cadeaux
            </button>
          </div>
        )}

        {card?.status === 'active' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            {card.is_test && (
              <div className="mb-6 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-semibold text-amber-800">
                Carte de test : elle n'a pas été facturée
              </div>
            )}
            <h1 className="font-display text-3xl mb-3">Votre carte cadeau est prête</h1>
            <p className="text-gray-700 mb-8">
              {card.recipient_email
                ? scheduled
                  ? `Elle sera envoyée par e-mail à ${card.recipient_name ?? card.recipient_email} le ${formatDate(card.send_at ?? '')}.`
                  : `Elle vient d'être envoyée par e-mail à ${card.recipient_name ?? card.recipient_email}.`
                : 'Elle vous a été envoyée par e-mail : transférez-la ou communiquez le code ci-dessous.'}{' '}
              Vous recevez aussi une confirmation d'achat.
            </p>

            <div className="bg-brand/5 border-2 border-brand/30 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-600">Carte cadeau {BRAND_NAME}</p>
              <p className="font-display text-5xl text-brand mt-1">{formatPrice(card.amount)}</p>
              {card.code && (
                <p className="mt-4 inline-block bg-white border border-gray-200 rounded-lg px-4 py-2 font-mono text-lg tracking-widest">
                  {card.code}
                </p>
              )}
              {card.expires_at && <p className="text-sm text-gray-600 mt-3">Valable jusqu'au {formatDate(card.expires_at)}</p>}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/reserver')}
              className="inline-flex items-center px-6 py-3 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark transition-colors"
            >
              Voir les disponibilités
            </button>
          </div>
        )}
      </section>
    </>
  );
}
