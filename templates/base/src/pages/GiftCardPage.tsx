import { useState } from 'react';
import { StayCoreApiError } from '@staycore/booking-sdk';
import type { GiftCardBalance, GiftCardCheckoutResponse, WebsiteModules } from '@staycore/booking-sdk';
import { useStayCore } from '@staycore/booking-sdk/react';
import { SeoHead } from '../components/common/SeoHead.tsx';
import { StripePanel } from '../components/booking/StripePanel.tsx';
import { BRAND_NAME } from '../config.ts';
import { formatDate, formatPrice } from '../lib/utils.ts';

type Props = {
  /** Amounts, bounds and validity set by the host in Stay'Core. */
  settings: WebsiteModules['gift_cards'];
  onNavigate: (path: string) => void;
};

const FIELD =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 mb-2';

const confirmationPath = (token: string) => `/carte-cadeau/confirmation/${encodeURIComponent(token)}`;

/**
 * Gift card purchase: amount, recipient, then payment on the host's Stripe
 * account. Stay'Core creates the card and emails it to the recipient (or to
 * the purchaser, who then hands it over).
 */
export function GiftCardPage({ settings, onNavigate }: Props) {
  const pms = useStayCore();

  const [amount, setAmount] = useState<number | null>(settings.amounts[0] ?? null);
  const [custom, setCustom] = useState('');
  const [toRecipient, setToRecipient] = useState(true);
  const [form, setForm] = useState({
    purchaser_name: '',
    purchaser_email: '',
    recipient_name: '',
    recipient_email: '',
    message: '',
    send_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<GiftCardCheckoutResponse | null>(null);

  const customAmount = parseFloat(custom.replace(',', '.'));
  const chosen = amount ?? (Number.isFinite(customAmount) ? customAmount : 0);
  const valid = amount !== null || (chosen >= settings.min_amount && chosen <= settings.max_amount);
  const today = new Date().toISOString().slice(0, 10);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen || !valid) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await pms.giftCards.checkout({
        amount: chosen,
        purchaser_name: form.purchaser_name.trim(),
        purchaser_email: form.purchaser_email.trim(),
        recipient_name: form.recipient_name.trim() || undefined,
        recipient_email: toRecipient ? form.recipient_email.trim() || undefined : undefined,
        message: form.message.trim() || undefined,
        send_at: toRecipient && form.send_at ? form.send_at : undefined,
        locale: 'fr',
      });

      // Test mode on a live Stripe key: nothing to pay, the card is already active.
      if (response.client_secret && response.stripe_public_key && !response.auto_confirmed_for_test) {
        setPayment(response);
        window.scrollTo(0, 0);
      } else {
        onNavigate(confirmationPath(response.gift_card_token));
      }
    } catch (err) {
      setError(
        err instanceof StayCoreApiError && err.status === 429
          ? 'Trop de tentatives en peu de temps. Patientez une minute, puis réessayez.'
          : err instanceof Error
            ? err.message
            : "La carte cadeau n'a pas pu être créée. Réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title={`Carte cadeau — ${BRAND_NAME}`}
        description={`Offrez un séjour chez ${BRAND_NAME} : carte cadeau envoyée par e-mail, valable ${settings.validity_months} mois.`}
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-4xl mb-3 text-gray-900">Offrir un séjour</h1>
        <p className="text-gray-700 mb-8">
          La carte cadeau arrive par e-mail et se dépense en une ou plusieurs fois, au moment de réserver.
        </p>

        {payment?.client_secret && payment.stripe_public_key ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl">Paiement sécurisé</h2>
            <p className="text-sm text-gray-600">
              Carte cadeau de <strong>{formatPrice(payment.amount)}</strong>
              {form.recipient_name ? ` pour ${form.recipient_name}` : ''}.{' '}
              <button type="button" className="text-brand underline" onClick={() => setPayment(null)}>
                Modifier
              </button>
            </p>
            <StripePanel
              clientSecret={payment.client_secret}
              stripePublicKey={payment.stripe_public_key}
              returnPath={confirmationPath(payment.gift_card_token)}
              confirm={() => pms.giftCards.confirm(payment.gift_card_token)}
              onConfirmed={() => onNavigate(confirmationPath(payment.gift_card_token))}
            />
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
            <fieldset>
              <legend className="font-display text-2xl text-gray-900">Le montant</legend>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {settings.amounts.map((value) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center h-16 rounded-xl border font-display text-2xl cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-brand ${
                      amount === value
                        ? 'border-brand bg-brand text-brand-contrast'
                        : 'border-gray-200 text-gray-900 hover:border-brand'
                    }`}
                  >
                    <input
                      type="radio"
                      name="amount"
                      className="sr-only"
                      checked={amount === value}
                      onChange={() => {
                        setAmount(value);
                        setCustom('');
                      }}
                    />
                    {formatPrice(value)}
                  </label>
                ))}
              </div>

              {settings.allow_custom_amount && (
                <label className="block mt-4 max-w-xs">
                  <span className={LABEL}>Ou un autre montant, en euros</span>
                  <input
                    className={FIELD}
                    inputMode="decimal"
                    value={custom}
                    onChange={(e) => {
                      setCustom(e.target.value);
                      setAmount(null);
                    }}
                    placeholder={`De ${settings.min_amount} à ${settings.max_amount}`}
                  />
                  {amount === null && custom && !valid && (
                    <span className="block text-sm text-red-600 mt-1">
                      Entre {formatPrice(settings.min_amount)} et {formatPrice(settings.max_amount)}.
                    </span>
                  )}
                </label>
              )}
            </fieldset>

            <fieldset>
              <legend className="font-display text-2xl text-gray-900">Pour qui</legend>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: true, title: "L'envoyer par e-mail", hint: 'Le destinataire la reçoit directement, à la date de votre choix.' },
                  { value: false, title: 'La recevoir moi-même', hint: "Vous recevez la carte et l'offrez quand vous voulez." },
                ].map((choice) => (
                  <label
                    key={String(choice.value)}
                    className={`rounded-xl border p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-brand ${
                      toRecipient === choice.value ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      className="sr-only"
                      checked={toRecipient === choice.value}
                      onChange={() => setToRecipient(choice.value)}
                    />
                    <span className="block font-medium text-gray-900">{choice.title}</span>
                    <span className="block text-sm text-gray-600 mt-1">{choice.hint}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={LABEL}>Prénom du destinataire</span>
                  <input className={FIELD} value={form.recipient_name} onChange={set('recipient_name')} autoComplete="off" />
                </label>
                {toRecipient && (
                  <>
                    <label className="block">
                      <span className={LABEL}>E-mail du destinataire</span>
                      <input
                        className={FIELD}
                        type="email"
                        required
                        value={form.recipient_email}
                        onChange={set('recipient_email')}
                        autoComplete="off"
                      />
                    </label>
                    <label className="block">
                      <span className={LABEL}>Date d'envoi (optionnel)</span>
                      <input className={FIELD} type="date" min={today} value={form.send_at} onChange={set('send_at')} />
                      <span className="block text-xs text-gray-500 mt-1">Vide : la carte part dès le paiement.</span>
                    </label>
                  </>
                )}
                <label className="block md:col-span-2">
                  <span className={LABEL}>Votre message (optionnel)</span>
                  <textarea
                    className={`${FIELD} resize-y`}
                    rows={3}
                    maxLength={600}
                    value={form.message}
                    onChange={set('message')}
                    placeholder="Quelques mots qui accompagneront la carte"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-display text-2xl text-gray-900">Vos coordonnées</legend>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={LABEL}>Prénom et nom</span>
                  <input className={FIELD} required value={form.purchaser_name} onChange={set('purchaser_name')} autoComplete="name" />
                  <span className="block text-xs text-gray-500 mt-1">Ils figurent sur la carte : « de la part de ».</span>
                </label>
                <label className="block">
                  <span className={LABEL}>E-mail</span>
                  <input
                    className={FIELD}
                    type="email"
                    required
                    value={form.purchaser_email}
                    onChange={set('purchaser_email')}
                    autoComplete="email"
                  />
                  <span className="block text-xs text-gray-500 mt-1">Pour votre confirmation d'achat.</span>
                </label>
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting || !chosen || !valid}
                className="w-full py-4 rounded-full bg-brand text-brand-contrast font-medium text-base hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting
                  ? 'Préparation du paiement…'
                  : chosen
                    ? `Continuer vers le paiement, ${formatPrice(chosen)}`
                    : 'Choisissez un montant'}
              </button>
              <p className="text-xs text-gray-600 mt-3">
                Valable {settings.validity_months} mois à compter de l'achat. Le solde non utilisé reste sur la carte.
              </p>
            </div>
          </form>
        )}

        <BalanceLookup onNavigate={onNavigate} />
      </section>
    </>
  );
}

/** Balance of a card, by the code received by email. */
function BalanceLookup({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pms = useStayCore();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<GiftCardBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await pms.giftCards.balance(code.trim()));
    } catch {
      setError("Le solde n'a pas pu être consulté. Patientez un instant, puis réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="font-display text-2xl text-gray-900 mb-4">Vous avez reçu une carte ?</h2>
      <form onSubmit={submit} className="flex gap-2 max-w-md">
        <label htmlFor="gift-card-balance-code" className="sr-only">
          Code de la carte cadeau
        </label>
        <input
          id="gift-card-balance-code"
          className={`${FIELD} font-mono`}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="shrink-0 px-5 py-3 rounded-full border border-brand text-brand text-sm font-medium hover:bg-brand/5 disabled:border-gray-200 disabled:text-gray-400 transition-colors"
        >
          {loading ? 'Recherche…' : 'Voir le solde'}
        </button>
      </form>

      <div aria-live="polite" className="mt-4 text-gray-800">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && !result.valid && <p className="text-sm text-red-600">{result.message}</p>}
        {result?.valid && (
          <p>
            Solde disponible : <strong>{formatBalance(result.balance)}</strong>
            {result.expires_at ? `, valable jusqu'au ${formatDate(result.expires_at)}` : ''}.{' '}
            <button type="button" className="text-brand underline" onClick={() => onNavigate('/reserver')}>
              Choisir mes dates
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

/** A balance keeps its cents, unlike the rounded prices shown elsewhere. */
function formatBalance(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}
