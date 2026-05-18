import { BRAND_NAME } from '../../config.ts';

type Props = {
  onNavigate: (path: string) => void;
};

export function Footer({ onNavigate }: Props) {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-display text-xl text-gray-900 mb-2">{BRAND_NAME}</p>
          <p className="text-sm text-gray-600 max-w-xs">
            Réservation directe, sans commissions Airbnb ou Booking.com.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Navigation</p>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => onNavigate('/')} className="text-gray-700 hover:text-brand">
                Accueil
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/properties')} className="text-gray-700 hover:text-brand">
                Nos suites
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/reserver')} className="text-gray-700 hover:text-brand">
                Réserver
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Légal</p>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => onNavigate('/mentions-legales')} className="text-gray-700 hover:text-brand">
                Mentions légales
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/cgv')} className="text-gray-700 hover:text-brand">
                CGV
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/privacy')} className="text-gray-700 hover:text-brand">
                Confidentialité
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {BRAND_NAME}. Propulsé par{' '}
        <a
          href="https://stay-core.com"
          target="_blank"
          rel="noreferrer noopener"
          className="text-brand hover:underline"
        >
          Stay'Core
        </a>
        .
      </div>
    </footer>
  );
}
