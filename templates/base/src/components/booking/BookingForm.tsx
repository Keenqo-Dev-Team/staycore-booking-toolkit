import { useMemo, useState } from 'react';
import { useAvailability, usePrice, useCheckout } from '@staycore/booking-sdk/react';
import type { CheckoutRequest, CheckoutResponse } from '@staycore/booking-sdk';
import { properties } from '../../data/properties.ts';
import { calculateNights, formatPrice, toNumber } from '../../lib/utils.ts';
import { trackEvent } from '../../utils/analytics.ts';
import { DatePickerCalendar } from './DatePickerCalendar.tsx';

type Props = {
  initialPropertyId?: number;
  onCheckoutCreated: (response: CheckoutResponse) => void;
};

export function BookingForm({ initialPropertyId, onCheckoutCreated }: Props) {
  const [propertyId, setPropertyId] = useState<number>(
    initialPropertyId ?? properties[0]?.pmsPropertyId ?? 0,
  );
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    guests_count: 2,
    message: '',
  });

  const availability = useAvailability(propertyId);
  const availabilityMap = useMemo(() => {
    const map: Record<string, NonNullable<typeof availability.data>['days'][number]> = {};
    availability.data?.days.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [availability.data]);

  const priceParams = useMemo(
    () =>
      form.check_in && form.check_out
        ? {
            check_in: form.check_in,
            check_out: form.check_out,
            guests_count: form.guests_count,
          }
        : null,
    [form.check_in, form.check_out, form.guests_count],
  );
  const price = usePrice(propertyId, priceParams);

  const checkout = useCheckout();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nights = calculateNights(form.check_in, form.check_out);
  const total = price.data ? toNumber(price.data.total) : 0;
  const canSubmit =
    nights > 0 &&
    !!form.guest_name &&
    !!form.guest_email &&
    !!form.guest_phone &&
    !price.isLoading &&
    !price.error &&
    !checkout.isLoading;

  const onDateChange = (checkIn: string, checkOut: string) => {
    setForm((f) => ({ ...f, check_in: checkIn, check_out: checkOut }));
    trackEvent('check_availability', { property_id: propertyId, check_in: checkIn, check_out: checkOut });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);

    const payload: CheckoutRequest = {
      property_id: propertyId,
      guest_name: form.guest_name.trim(),
      guest_email: form.guest_email.trim(),
      guest_phone: form.guest_phone.trim() || undefined,
      check_in: form.check_in,
      check_out: form.check_out,
      guests_count: form.guests_count,
      message: form.message.trim() || undefined,
      locale: 'fr',
    };

    try {
      const response = await checkout.submit(payload);
      trackEvent('begin_checkout', { property_id: propertyId, value: total });
      onCheckoutCreated(response);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
      <h2 className="font-display text-2xl sm:text-3xl">Réservez votre séjour</h2>

      {properties.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Suite</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {properties.map((p) => (
              <option key={p.pmsPropertyId} value={p.pmsPropertyId}>
                {p.name} — {p.city}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dates de séjour</label>
        <div className="rounded-xl border border-gray-200 p-4">
          <DatePickerCalendar
            checkIn={form.check_in}
            checkOut={form.check_out}
            onChange={onDateChange}
            availability={availabilityMap}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de voyageurs</label>
        <select
          value={form.guests_count}
          onChange={(e) => setForm((f) => ({ ...f, guests_count: Number(e.target.value) }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n > 1 ? 'voyageurs' : 'voyageur'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
          <input
            type="text"
            required
            value={form.guest_name}
            onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="Jean Dupont"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            required
            value={form.guest_email}
            onChange={(e) => setForm((f) => ({ ...f, guest_email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="jean@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
        <input
          type="tel"
          required
          value={form.guest_phone}
          onChange={(e) => setForm((f) => ({ ...f, guest_phone: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="+33 6 12 34 56 78"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message (optionnel)</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
          placeholder="Anniversaire, allergies, préférences…"
        />
      </div>

      {nights > 0 && price.data && (
        <div className="bg-brand/5 border-2 border-brand/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-2xl font-display text-brand">{formatPrice(total)}</span>
          </div>
          <p className="text-sm text-gray-700">
            {nights} {nights > 1 ? 'nuits' : 'nuit'}
            {price.data.nightly_average ? ` × ${formatPrice(toNumber(price.data.nightly_average))}` : ''}
          </p>
          <p className="text-xs text-gray-600 mt-2">Réservation directe, sans commission.</p>
        </div>
      )}

      {price.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {price.error.message}
        </p>
      )}
      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-4 rounded-full bg-brand text-brand-contrast font-medium text-base hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {checkout.isLoading ? 'Création de la réservation…' : 'Continuer vers le paiement'}
      </button>
    </form>
  );
}
