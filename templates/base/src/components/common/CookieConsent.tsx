import { useEffect, useState } from 'react';
import { grantAnalyticsConsent, denyAnalyticsConsent } from '../../utils/analytics.ts';

const STORAGE_KEY = 'cookie-consent';

type ConsentChoice = 'accepted' | 'rejected';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = (typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null) as
      | ConsentChoice
      | null;

    if (stored === 'accepted') {
      grantAnalyticsConsent();
    } else if (stored === 'rejected') {
      denyAnalyticsConsent();
    } else {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    grantAnalyticsConsent();
    setVisible(false);
  };

  const reject = () => {
    window.localStorage.setItem(STORAGE_KEY, 'rejected');
    denyAnalyticsConsent();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Bandeau cookies"
      className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:max-w-md z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-5"
    >
      <p className="text-sm text-gray-800 mb-4">
        Nous utilisons des cookies pour mesurer la fréquentation et améliorer le site.
        Aucune donnée ne sort sans votre accord.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={reject}
          className="px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={accept}
          className="px-4 py-2 text-sm bg-brand text-brand-contrast rounded-full hover:bg-brand-dark"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
