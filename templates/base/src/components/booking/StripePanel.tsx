import { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useStayCore } from '@staycore/booking-sdk/react';

type Props = {
  clientSecret: string;
  stripePublicKey: string;
  /** Booking to confirm once paid. Omit it when `confirm` and `returnPath` are given. */
  bookingToken?: string;
  /** Where the bank sends the visitor back after a redirect (3-D Secure). */
  returnPath?: string;
  /** Server-side confirmation once Stripe has charged. Defaults to confirming the booking. */
  confirm?: () => Promise<unknown>;
  onConfirmed: () => void;
};

export function StripePanel({ bookingToken, clientSecret, stripePublicKey, returnPath, confirm, onConfirmed }: Props) {
  const pms = useStayCore();
  const path = returnPath ?? `/reservation/${encodeURIComponent(bookingToken ?? '')}`;
  const confirmPaid = confirm ?? (() => pms.booking.confirm(bookingToken ?? ''));

  const stripePromise = useMemo<Promise<StripeJs | null>>(
    () => loadStripe(stripePublicKey),
    [stripePublicKey],
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <StripeForm returnPath={path} confirm={confirmPaid} onConfirmed={onConfirmed} />
    </Elements>
  );
}

function StripeForm({
  returnPath,
  confirm,
  onConfirmed,
}: {
  returnPath: string;
  confirm: () => Promise<unknown>;
  onConfirmed: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [returnPath]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}${returnPath}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Le paiement a échoué.');
      setSubmitting(false);
      return;
    }

    // Stripe peut renvoyer plusieurs statuts terminaux. Toujours afficher
    // quelque chose pour ne pas rester figé sur « Paiement en cours… ».
    const status = paymentIntent?.status;

    if (status === 'succeeded') {
      try {
        await confirm();
        onConfirmed();
      } catch (err) {
        setError(err instanceof Error
          ? `Le paiement a réussi mais la confirmation côté serveur a échoué : ${err.message}`
          : 'Confirmation impossible — contacte le support avec ton numéro de réservation.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (status === 'processing') {
      setError('Ta banque traite encore le paiement. Tu recevras un email de confirmation dès qu’il sera validé.');
      setSubmitting(false);
      return;
    }

    if (status === 'requires_action' || status === 'requires_confirmation') {
      setError('Une authentification supplémentaire est demandée par ta banque. Suis les instructions Stripe, puis réessaie.');
      setSubmitting(false);
      return;
    }

    if (status === 'requires_payment_method') {
      setError('La carte a été refusée. Vérifie les informations ou essaie un autre moyen de paiement.');
      setSubmitting(false);
      return;
    }

    // Statut inattendu (ex. "canceled" ou autre nouveau status Stripe) — on
    // évite explicitement de laisser le bouton figé.
    setError(`Paiement en statut inattendu (${status ?? 'inconnu'}). Réessaie ou contacte le support.`);
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-4 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark disabled:bg-gray-300 transition-colors"
      >
        {submitting ? 'Paiement en cours…' : 'Confirmer le paiement'}
      </button>
    </form>
  );
}
