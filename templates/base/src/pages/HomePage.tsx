import { Hero } from '../components/common/Hero.tsx';
import { PropertyCard } from '../components/property/PropertyCard.tsx';
import { SeoHead } from '../components/common/SeoHead.tsx';
import { BRAND_NAME, BRAND_TAGLINE } from '../config.ts';
import { properties } from '../data/properties.ts';

type Props = {
  onNavigate: (path: string) => void;
};

export function HomePage({ onNavigate }: Props) {
  const heroImage = properties[0]?.heroImage;

  return (
    <>
      <SeoHead title={`${BRAND_NAME} — Réservation directe`} description={BRAND_TAGLINE} />
      <Hero onCta={() => onNavigate('/reserver')} image={heroImage} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-brand mb-3">Nos suites</p>
          <h2 className="font-display text-4xl sm:text-5xl text-gray-900">
            Choisissez votre prochaine évasion
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {properties.map((p) => (
            <PropertyCard key={p.slug} property={p} onClick={() => onNavigate(`/properties/${p.slug}`)} />
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-display text-brand mb-2">0 %</p>
            <p className="font-medium text-gray-900 mb-1">Commission</p>
            <p className="text-sm text-gray-600">Pas d'intermédiaire, vous économisez 15-20 % par rapport à Airbnb.</p>
          </div>
          <div>
            <p className="text-4xl font-display text-brand mb-2">24/7</p>
            <p className="font-medium text-gray-900 mb-1">Support direct</p>
            <p className="text-sm text-gray-600">Une question ? Nous sommes joignables directement, sans plateforme intermédiaire.</p>
          </div>
          <div>
            <p className="text-4xl font-display text-brand mb-2">100 %</p>
            <p className="font-medium text-gray-900 mb-1">Sécurisé</p>
            <p className="text-sm text-gray-600">Paiement Stripe, caution remboursable, réservation confirmée par email.</p>
          </div>
        </div>
      </section>
    </>
  );
}
