import { useCallback, useEffect, useRef, useState } from 'react';
import { StayCoreApiError } from '../errors.js';
import { useStayCore } from './provider.js';
import type {
  ChatContactDetails,
  ChatMessage,
  ChatSessionRequest,
  ChatThreadState,
} from '../types.js';

export type UseChatOptions = {
  /**
   * True while the chat is on screen. Polling only runs then: a closed bubble
   * costs nothing, and the backend uses the polling to know the visitor is
   * still there (otherwise replies go out by email).
   */
  active: boolean;
  /** Property the visitor is looking at; the host's assistant is set per property. */
  propertyId?: number;
  locale?: 'fr' | 'en';
  /** Delay between two polls while messages flow. Default 3000 ms. */
  pollIntervalMs?: number;
  /** Returns a Turnstile token when `modules.captcha` is set. */
  getCaptchaToken?: () => Promise<string | null>;
};

export type UseChatResult = {
  messages: ChatMessage[];
  /** Who answers next. Null until a conversation exists. */
  thread: ChatThreadState | null;
  welcomeMessage: string | null;
  isSending: boolean;
  error: Error | null;
  /** True once a conversation exists (now or restored from a previous visit). */
  hasSession: boolean;
  send: (content: string) => Promise<void>;
  saveContact: (details: ChatContactDetails) => Promise<void>;
  /** Forgets the conversation on this device. */
  reset: () => void;
};

const SLOW_AFTER_MS = 5 * 60_000;
const SLOW_INTERVAL_MS = 15_000;

function storageKey(orgSlug: string) {
  return `staycore:chat:${orgSlug}`;
}

function readToken(orgSlug: string): string | null {
  try {
    return globalThis.localStorage?.getItem(storageKey(orgSlug)) ?? null;
  } catch {
    return null;
  }
}

function writeToken(orgSlug: string, token: string | null) {
  try {
    if (token) globalThis.localStorage?.setItem(storageKey(orgSlug), token);
    else globalThis.localStorage?.removeItem(storageKey(orgSlug));
  } catch {
    // Private mode or blocked storage: the conversation lives for this page only.
  }
}

function merge(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !seen.has(m.id));
  return added.length === 0 ? current : [...current, ...added].sort((a, b) => a.id - b.id);
}

/**
 * Website chat, answered by the host's AI assistant and taken over by a human
 * from the Stay'Core inbox.
 *
 * The session opens lazily, on the first message: a visitor who only opens the
 * bubble creates nothing server-side. The visitor token is kept in
 * localStorage so the conversation survives a reload or a later visit.
 */
export function useChat(options: UseChatOptions): UseChatResult {
  const client = useStayCore();
  const { active, propertyId, locale, pollIntervalMs = 3000, getCaptchaToken } = options;

  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThreadState | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastId = useRef(0);
  const lastActivity = useRef(Date.now());

  const forget = useCallback(() => {
    writeToken(client.orgSlug, null);
    lastId.current = 0;
    setToken(null);
    setMessages([]);
    setThread(null);
  }, [client.orgSlug]);

  const accept = useCallback((incoming: ChatMessage[], state: ChatThreadState) => {
    if (incoming.length > 0) {
      lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
      lastActivity.current = Date.now();
      setMessages((current) => merge(current, incoming));
    }
    setThread(state);
  }, []);

  // Resume a conversation from a previous visit.
  useEffect(() => {
    const stored = readToken(client.orgSlug);
    if (stored) setToken(stored);
  }, [client.orgSlug]);

  // Poll while the chat is on screen and the tab is visible.
  useEffect(() => {
    if (!active || !token) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;

      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        try {
          const result = await client.chat.messages(token, lastId.current ? { after: lastId.current } : undefined);
          if (cancelled) return;
          accept(result.messages, result.thread);
        } catch (err) {
          if (cancelled) return;
          // The session no longer exists server-side: start over on the next message.
          if (err instanceof StayCoreApiError && err.status === 401) {
            forget();
            return;
          }
        }
      }

      const quiet = Date.now() - lastActivity.current > SLOW_AFTER_MS;
      timer = setTimeout(tick, quiet ? SLOW_INTERVAL_MS : pollIntervalMs);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, token, client, pollIntervalMs, accept, forget]);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (token) return token;

    const payload: ChatSessionRequest = {
      property_id: propertyId,
      locale,
      origin_url: typeof window !== 'undefined' ? window.location.href : undefined,
      captcha_token: (await getCaptchaToken?.()) ?? undefined,
    };
    const session = await client.chat.open(payload);

    writeToken(client.orgSlug, session.token);
    setToken(session.token);
    setWelcomeMessage(session.welcome_message);
    setThread(session.thread);

    return session.token;
  }, [token, client, propertyId, locale, getCaptchaToken]);

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;

      setIsSending(true);
      setError(null);
      try {
        const sessionToken = await ensureSession();
        const result = await client.chat.send(sessionToken, text);
        accept([result.message], result.thread);
      } catch (err) {
        if (err instanceof StayCoreApiError && err.status === 401) forget();
        const failure = err instanceof Error ? err : new Error(String(err));
        setError(failure);
        throw failure;
      } finally {
        setIsSending(false);
      }
    },
    [client, ensureSession, accept, forget],
  );

  const saveContact = useCallback(
    async (details: ChatContactDetails) => {
      const sessionToken = await ensureSession();
      const result = await client.chat.saveContact(sessionToken, details);
      setThread(result.thread);
    },
    [client, ensureSession],
  );

  return {
    messages,
    thread,
    welcomeMessage,
    isSending,
    error,
    hasSession: token !== null,
    send,
    saveContact,
    reset: forget,
  };
}
