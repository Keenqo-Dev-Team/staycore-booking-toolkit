import { useState } from 'react';
import { StayCoreApiError } from '@staycore/booking-sdk';
import { useStayCore } from '@staycore/booking-sdk/react';
import { SeoHead } from '../components/common/SeoHead.tsx';
import { BRAND_NAME } from '../config.ts';

type State = 'idle' | 'sending' | 'sent' | 'error';

const FIELD =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent';

/**
 * Contact form. The message opens a conversation in the host's Stay'Core
 * inbox; the host replies from there and the answer reaches the visitor by
 * email. Shown when the host enabled the contact module.
 */
export function ContactPage() {
  const pms = useStayCore();
  const [state, setState] = useState<State>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setState('sending');
    setProblem(null);

    try {
      await pms.contact.send({
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone || undefined,
        message: data.message ?? '',
        locale: 'fr',
        origin_url: window.location.href,
        website: data.website || undefined,
      });
      setState('sent');
    } catch (err) {
      // The per-address quota (429) comes with a readable message: show it as is.
      if (err instanceof StayCoreApiError && err.status === 429) setProblem(err.message);
      setState('error');
    }
  };

  return (
    <>
      <SeoHead title={`Contact — ${BRAND_NAME}`} description={`Une question avant de réserver ? Écrivez à ${BRAND_NAME}.`} />

      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-display text-4xl mb-3 text-gray-900">Une question avant de réserver ?</h1>
        <p className="text-gray-700 mb-8">Écrivez-nous : la réponse vous arrive par e-mail.</p>

        {state === 'sent' ? (
          <p role="status" className="bg-brand/5 border border-brand/30 rounded-2xl p-8 font-display text-2xl text-gray-900">
            Message envoyé. Nous vous répondons très vite.
          </p>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Nom</span>
                <input name="name" required autoComplete="name" className={FIELD} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Téléphone (optionnel)</span>
                <input name="phone" type="tel" autoComplete="tel" className={FIELD} />
              </label>
            </div>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">E-mail</span>
              <input name="email" type="email" required autoComplete="email" className={FIELD} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">Votre message</span>
              <textarea name="message" required rows={5} maxLength={4000} className={`${FIELD} resize-y`} />
            </label>
            {/* Honeypot: hidden from visitors, filled in by bots. */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

            {state === 'error' && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {problem ?? "Le message n'est pas parti. Vérifiez votre connexion, puis réessayez."}
              </p>
            )}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark disabled:bg-gray-300 transition-colors"
            >
              {state === 'sending' ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
