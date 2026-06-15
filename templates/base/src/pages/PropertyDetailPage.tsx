import { SeoHead } from '../components/common/SeoHead.tsx';
import { JsonLd } from '../components/common/JsonLd.tsx';
import { Gallery } from '../components/property/Gallery.tsx';
import { AmenitiesGrid } from '../components/property/AmenitiesGrid.tsx';
import { findPropertyBySlug } from '../data/properties.ts';

type Props = {
  propertySlug: string;
  onNavigate: (path: string) => void;
};

export function PropertyDetailPage({ propertySlug, onNavigate }: Props) {
  const property = findPropertyBySlug(propertySlug);

  if (!property) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl mb-4">Suite introuvable</h1>
        <button
          type="button"
          onClick={() => onNavigate('/properties')}
          className="text-brand hover:underline"
        >
          Revenir à la liste
        </button>
      </section>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: property.seo.description,
    image: property.gallery,
    priceRange: property.schema.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.schema.streetAddress,
      postalCode: property.schema.postalCode,
      addressLocality: property.schema.addressLocality,
      addressCountry: property.schema.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.schema.latitude,
      longitude: property.schema.longitude,
    },
  };

  return (
    <>
      <SeoHead
        title={property.seo.title}
        description={property.seo.description}
        keywords={property.seo.keywords}
        image={property.heroImage}
      />
      <JsonLd data={jsonLd} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm uppercase tracking-widest text-brand mb-2">{property.city}</p>
        <h1 className="font-display text-4xl sm:text-6xl mb-6 text-gray-900">{property.name}</h1>

        <Gallery images={property.gallery} alt={property.name} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
          <div className="lg:col-span-2 space-y-10">
            <article className="prose max-w-none text-gray-800 whitespace-pre-line">
              {property.longDescription}
            </article>

            <div>
              <h2 className="font-display text-2xl mb-4">Équipements</h2>
              <AmenitiesGrid amenities={property.amenities} />
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <p className="font-display text-xl mb-2">Réserver en direct</p>
              <p className="text-sm text-gray-600 mb-4">Meilleur tarif garanti, sans commission.</p>
              <button
                type="button"
                onClick={() => onNavigate(`/reserver?property=${property.slug}`)}
                className="w-full py-3 rounded-full bg-brand text-brand-contrast font-medium hover:bg-brand-dark transition-colors"
              >
                Vérifier les disponibilités
              </button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
