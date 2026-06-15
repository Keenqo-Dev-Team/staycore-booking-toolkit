import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailabilityCalendarDay } from '@staycore/booking-sdk';

type Props = {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  /** Optional map of availability per ISO date (YYYY-MM-DD). */
  availability?: Record<string, AvailabilityCalendarDay>;
  errors?: { checkIn?: string; checkOut?: string };
};

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const days: Date[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(new Date(year, month, -startWeekday + i + 1));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]!;
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

export function DatePickerCalendar({ checkIn, checkOut, onChange, availability, errors }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState(() => {
    const base = checkIn ? new Date(checkIn) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Une réservation se compte en NUITS : `available === false` signifie que la
  // NUIT commençant ce jour-là est occupée. Un jour d'arrivée d'une autre résa
  // peut donc rester une date de DÉPART valide pour la nôtre (rotation le matin).
  const isNightBooked = (iso: string) => availability?.[iso]?.available === false;

  // Mode sélection : on choisit le départ dès qu'une arrivée est posée sans départ.
  const selectingCheckout = !!checkIn && !checkOut;

  // Départ maximal sélectionnable = première nuit occupée STRICTEMENT après
  // l'arrivée (incluse, car on libère le logement ce matin-là). Au-delà, il
  // faudrait occuper une nuit déjà réservée. null = aucune contrainte en vue.
  const maxCheckout = useMemo(() => {
    if (!selectingCheckout || !checkIn) return null;
    const start = new Date(checkIn);
    for (let i = 1; i <= 366; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (isNightBooked(ymd(d))) return ymd(d);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectingCheckout, checkIn, availability]);

  const handleClick = (date: Date) => {
    const iso = ymd(date);
    if (date < today) return;
    if (!checkIn || (checkIn && checkOut)) {
      onChange(iso, '');
      return;
    }
    if (iso <= checkIn) {
      onChange(iso, '');
      return;
    }
    onChange(checkIn, iso);
  };

  const monthLabel = cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const days = monthDays(cursor.getFullYear(), cursor.getMonth());

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Mois précédent"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="font-medium capitalize">{monthLabel}</p>
        <button
          type="button"
          aria-label="Mois suivant"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const iso = ymd(d);
          const inCurrentMonth = d.getMonth() === cursor.getMonth();
          const isPast = d < today;
          const isBooked = isNightBooked(iso);
          const isCheckIn = iso === checkIn;
          const isCheckOut = iso === checkOut;
          const isInRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;

          let disabled: boolean;
          if (selectingCheckout) {
            // Candidat départ : après l'arrivée, jusqu'à la 1re nuit occupée
            // incluse (cette case occupée reste cliquable comme départ → nuit
            // orpheline réservable). Sinon on peut redémarrer sur un jour libre.
            const validCheckout =
              !isPast && inCurrentMonth && iso > checkIn && (maxCheckout === null || iso <= maxCheckout);
            const canRestart = !isPast && inCurrentMonth && !isBooked && iso <= checkIn;
            disabled = !(validCheckout || canRestart);
          } else {
            // Sélection de l'arrivée : une nuit occupée n'est pas un point de départ.
            disabled = isPast || isBooked || !inCurrentMonth;
          }

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(d)}
              className={[
                'aspect-square text-sm rounded-lg transition-colors',
                !inCurrentMonth && 'text-gray-300',
                inCurrentMonth && !disabled && 'hover:bg-brand/10',
                (isCheckIn || isCheckOut) && 'bg-brand text-brand-contrast hover:bg-brand-dark',
                isInRange && 'bg-brand/20',
                disabled && 'text-gray-300 cursor-not-allowed line-through',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {(errors?.checkIn || errors?.checkOut) && (
        <p className="mt-3 text-sm text-red-600">{errors.checkIn || errors.checkOut}</p>
      )}
    </div>
  );
}
