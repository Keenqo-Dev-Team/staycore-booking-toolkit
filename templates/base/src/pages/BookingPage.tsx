import { useState } from 'react';
import { useOrgConfig } from '@staycore/booking-sdk/react';
import type { CheckoutResponse } from '@staycore/booking-sdk';
import { SeoHead } from '../components/common/SeoHead.tsx';
import { BookingForm } from '../components/booking/BookingForm.tsx';
import { StripePanel } from '../components/booking/StripePanel.tsx';
import { BRAND_NAME, STRIPE_PUBLIC_KEY_FALLBACK } from '../config.ts';
import { findPropertyBySlug } from '../data/properties.ts';

type Step = 'form' | 'payment' | 'confirmation' | 'request';

type Props = {
  onNavigate: (path: string) => void;
};

export function BookingPage({ onNavigate }: Props) {
  const orgConfig = useOrgConfig();
  const [step, setStep] = useState<Step>('form');
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);

  const initialPropertySlug =
    new URLSearchParams(window.location.search).get('property') ?? undefined;
  const initialProperty = initialPropertySlug ? findPropertyBySlug(initialPropertySlug) : undefined;

  const stripePublicKey =
    checkout?.stripe_public_key ?? orgConfig.data?.stripe_public_key ?? STRIPE_PUBLIC_KEY_FALLBACK;

  const handleCheckoutCreated = (response: CheckoutResponse) => {
    setCheckout(response);

    // Test mode + clé Stripe live : le backend a auto-confirmé la résa
    // (pas de PaymentIntent à valider). On va direct à l'écran "confirmation"
    // qui affiche le bon message — pas "Demande envoyée" qui suggérerait
    // une attente de validation manuelle.
    if (response.auto_confirmed_for_test) {
      setStep('confirmation');
      return;
    }

    if (response.payment_mode === 'request') {
      setStep('request');
      return;
    }
    if (response.client_secret) {
      setStep('payment');
      return;
    }
    setStep('confirmation');
  };

  return (
    <>
      <SeoHead
        title={`Réserver — ${BRAND_NAME}`}
        description="Réservation directe : meilleur tarif, sans commission."
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {step === 'form' && (
          <BookingForm
            initialPropertyId={initialProperty?.pmsPropertyId}
            onCheckoutCreated={handleCheckoutCreated}
          />
        )}

        {step === 'payment' && checkout?.client_secret && stripePublicKey && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl">Paiement sécurisé</h2>
            <p className="text-sm text-gray-600">
              Total à régler maintenant : <strong>{checkout.charge_amount ?? checkout.total_amount} €</strong>
            </p>
            <StripePanel
              bookingToken={checkout.booking_token}
              clientSecret={checkout.client_secret}
              stripePublicKey={stripePublicKey}
              onConfirmed={() => setStep('confirmation')}
            />
          </div>
        )}

        {step === 'request' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="font-display text-3xl mb-3">Demande envoyée !</h2>
            <p className="text-gray-700 mb-6">
              Votre demande a été transmise. Nous reviendrons vers vous très rapidement par email.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center px-6 py-3 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            {checkout?.is_test && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-semibold text-amber-800">
                🧪 Réservation de test — aucun paiement n'a été effectué
              </div>
            )}
            <h2 className="font-display text-3xl mb-3">
              {checkout?.is_test ? 'Réservation de test confirmée !' : 'Réservation confirmée !'}
            </h2>
            <p className="text-gray-700 mb-6">
              {checkout?.is_test
                ? "Le mode test est activé sur ce moteur de réservation : aucune nuit n'a été bloquée, aucun paiement n'a eu lieu, mais le flow complet a tourné (email de confirmation, scénarios automatiques, génération code d'accès…)."
                : 'Un email de confirmation vient de partir vers la boîte renseignée.'}
            </p>
            {checkout?.booking_token && (
              <p className="text-sm text-gray-600 mb-6">
                Numéro de suivi :{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{checkout.booking_token}</code>
              </p>
            )}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center px-6 py-3 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </section>
    </>
  );
}
