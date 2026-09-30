import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '@staycore/booking-sdk/react';
import type { ChatMessage } from '@staycore/booking-sdk';
import { BRAND_NAME } from '../../config.ts';

const DEFAULT_WELCOME = 'Bonjour, une question sur le logement ou sur vos dates ?';

type Props = {
  /** Welcome message set by the host in Stay'Core (Moteur de résa › Site web). */
  welcome?: string | null;
  /** Property the visitor is looking at, when the page is about one. */
  propertyId?: number;
  onNavigate: (path: string) => void;
};

/**
 * Website chat. The host's Stay'Core assistant answers; the conversation lands
 * in the host's inbox, where a human can take over. When that happens the
 * visitor is asked for an email, so the reply reaches them after they leave.
 */
export function ChatBubble({ welcome, propertyId, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const chat = useChat({ active: open, propertyId, locale: 'fr' });
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length, open, chat.isSending]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || chat.isSending) return;
    setDraft('');
    try {
      await chat.send(text);
    } catch {
      // Not sent: hand the text back to the visitor.
      setDraft(text);
    }
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    try {
      await chat.saveContact({ email: email.trim() });
      setEmailSaved(true);
    } catch {
      setEmailError('Adresse non enregistrée. Vérifiez-la et réessayez.');
    }
  };

  const status = chat.thread?.status ?? 'assistant';
  const hasContact = emailSaved || Boolean(chat.thread?.has_contact);
  const askEmail = chat.hasSession && chat.messages.length > 0 && status !== 'assistant' && !hasContact;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="staycore-chat"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand text-brand-contrast px-4 py-3 shadow-lg hover:bg-brand-dark transition-colors ${
          open ? 'max-sm:hidden' : ''
        }`}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="hidden sm:inline text-sm font-medium">{open ? 'Fermer' : 'Une question ?'}</span>
      </button>

      <div
        id="staycore-chat"
        role="dialog"
        aria-label={`Discuter avec ${BRAND_NAME}`}
        // The class, not the `hidden` attribute: Tailwind's `flex` would override it.
        className={`${
          open ? 'flex' : 'hidden'
        } fixed inset-0 z-50 flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:h-[min(36rem,calc(100vh-8rem))] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl sm:overflow-hidden`}
      >
        <header className="flex items-start justify-between gap-4 bg-brand text-brand-contrast px-5 py-4">
          <div>
            <p className="font-display text-xl leading-tight">{BRAND_NAME}</p>
            <p className="text-sm opacity-80 mt-0.5" aria-live="polite">
              {status === 'assistant'
                ? "Notre assistant vous répond, l'équipe prend le relais si besoin."
                : status === 'awaiting_host'
                  ? "Votre question est transmise à l'équipe."
                  : "L'équipe vous répond ici."}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le chat" className="sm:hidden p-1">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div ref={list} className="flex-1 overflow-y-auto px-5 py-5 space-y-4" aria-live="polite">
          <Bubble role="assistant" label="Assistant">
            {welcome || DEFAULT_WELCOME}
          </Bubble>

          {chat.messages.map((message) => (
            <Bubble
              key={message.id}
              role={message.role}
              label={message.role === 'assistant' ? 'Assistant' : message.role === 'host' ? BRAND_NAME : undefined}
            >
              <MessageText
                message={message}
                onBook={(path) => {
                  setOpen(false);
                  onNavigate(path);
                }}
              />
            </Bubble>
          ))}

          {chat.isSending && <p className="text-right text-sm text-gray-500">Envoi…</p>}

          {chat.error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {chat.error.message || "Le message n'est pas parti. Réessayez."}
            </p>
          )}

          {askEmail && (
            <form onSubmit={saveEmail} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label htmlFor="staycore-chat-email" className="block text-sm text-gray-800">
                Laissez votre e-mail : la réponse vous arrive même si vous quittez le site.
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id="staycore-chat-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="vous@exemple.fr"
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 py-2 rounded-full bg-brand text-brand-contrast text-sm font-medium hover:bg-brand-dark transition-colors"
                >
                  Valider
                </button>
              </div>
              {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
            </form>
          )}

          {emailSaved && <p className="text-sm text-gray-600">C'est noté : la réponse vous arrivera aussi par e-mail.</p>}
        </div>

        <form onSubmit={submit} className="border-t border-gray-100 p-3 flex items-end gap-2">
          <label htmlFor="staycore-chat-message" className="sr-only">
            Votre message
          </label>
          <textarea
            id="staycore-chat-message"
            ref={input}
            rows={1}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Écrivez votre message"
            className="w-full max-h-32 min-h-[2.75rem] px-3 py-2.5 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!draft.trim() || chat.isSending}
            className="shrink-0 px-4 py-2.5 rounded-full bg-brand text-brand-contrast text-sm font-medium hover:bg-brand-dark disabled:bg-gray-300 transition-colors"
          >
            Envoyer
          </button>
        </form>
      </div>
    </>
  );
}

function Bubble({ role, label, children }: { role: ChatMessage['role']; label?: string; children: React.ReactNode }) {
  const mine = role === 'visitor';

  return (
    <div className={mine ? 'flex justify-end' : 'flex justify-start'}>
      <div className="max-w-[85%]">
        {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
        <div
          className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            mine ? 'rounded-br-sm bg-brand text-brand-contrast' : 'rounded-bl-sm bg-gray-100 text-gray-900'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const URL_PATTERN = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])/g;

/**
 * Message text with its links. A link to this site's booking page becomes a
 * button: it is the one the assistant sends when the requested dates are free.
 */
function MessageText({ message, onBook }: { message: ChatMessage; onBook: (path: string) => void }) {
  if (message.role === 'visitor') return <>{message.content}</>;

  return (
    <>
      {message.content.split(URL_PATTERN).map((part, index) => {
        if (index % 2 === 0) return part;

        const booking = bookingPath(part);
        if (booking) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onBook(booking)}
              className="my-2 inline-flex items-center px-4 py-2 rounded-full bg-brand text-brand-contrast text-sm font-medium hover:bg-brand-dark transition-colors"
            >
              Voir ces dates et réserver
            </button>
          );
        }

        return (
          <a key={index} href={part} target="_blank" rel="noopener nofollow" className="text-brand underline break-all">
            {part}
          </a>
        );
      })}
    </>
  );
}

/** Internal path when the URL points to this site's booking page, otherwise null. */
function bookingPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const booking = parsed.pathname.startsWith('/reserver') || parsed.pathname.startsWith('/booking');
    return parsed.origin === window.location.origin && booking ? parsed.pathname + parsed.search : null;
  } catch {
    return null;
  }
}
