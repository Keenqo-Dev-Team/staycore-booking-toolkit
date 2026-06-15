import { SeoHead } from '../components/common/SeoHead.tsx';
import { PropertyCard } from '../components/property/PropertyCard.tsx';
import { BRAND_NAME } from '../config.ts';
import { properties } from '../data/properties.ts';

type Props = {
  onNavigate: (path: string) => void;
};

export function PropertiesPage({ onNavigate }: Props) {
  return (
    <>
      <SeoHead
        title={`Nos suites — ${BRAND_NAME}`}
        description="Découvrez toutes nos suites en réservation directe."
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h1 className="font-display text-4xl sm:text-5xl mb-2 text-gray-900">Nos suites</h1>
        <p className="text-gray-600 mb-12 max-w-2xl">
          Sélectionnez votre suite et réservez en quelques clics, sans commission.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {properties.map((p) => (
            <PropertyCard
              key={p.slug}
              property={p}
              onClick={() => onNavigate(`/properties/${p.slug}`)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
