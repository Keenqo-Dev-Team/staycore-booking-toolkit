import { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useStayCore } from '@staycore/booking-sdk/react';

type Props = {
  bookingToken: string;
  clientSecret: string;
  stripePublicKey: string;
  onConfirmed: () => void;
};

export function StripePanel({ bookingToken, clientSecret, stripePublicKey, onConfirmed }: Props) {
  const stripePromise = useMemo<Promise<StripeJs | null>>(
    () => loadStripe(stripePublicKey),
    [stripePublicKey],
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <StripeForm bookingToken={bookingToken} onConfirmed={onConfirmed} />
    </Elements>
  );
}

function StripeForm({
  bookingToken,
  onConfirmed,
}: {
  bookingToken: string;
  onConfirmed: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const pms = useStayCore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [bookingToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/reservation/${encodeURIComponent(bookingToken)}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Le paiement a échoué.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await pms.booking.confirm(bookingToken);
        onConfirmed();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Confirmation impossible.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitting(false);
    }
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
