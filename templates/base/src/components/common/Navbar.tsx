import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BRAND_NAME } from '../../config.ts';

type Props = {
  onNavigate: (path: string) => void;
  currentPath: string;
};

const LINKS = [
  { path: '/', label: 'Accueil' },
  { path: '/properties', label: 'Nos suites' },
  { path: '/reserver', label: 'Réserver' },
];

export function Navbar({ onNavigate, currentPath }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="font-display text-xl sm:text-2xl text-gray-900 tracking-wide"
        >
          {BRAND_NAME}
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <button
              key={l.path}
              type="button"
              onClick={() => onNavigate(l.path)}
              className={`text-sm font-medium transition-colors ${
                currentPath === l.path ? 'text-brand' : 'text-gray-700 hover:text-brand'
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onNavigate('/reserver')}
            className="ml-2 inline-flex items-center px-4 py-2 rounded-full bg-brand text-brand-contrast text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            Réservation directe
          </button>
        </nav>

        <button
          type="button"
          aria-label="Menu"
          className="md:hidden p-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-gray-100 bg-white">
          {LINKS.map((l) => (
            <button
              key={l.path}
              type="button"
              onClick={() => {
                onNavigate(l.path);
                setOpen(false);
              }}
              className="block w-full text-left px-6 py-3 text-gray-700 border-b border-gray-50 hover:bg-gray-50"
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
