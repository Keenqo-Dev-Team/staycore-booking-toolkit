import type { PropertyData } from '../../data/properties.ts';
import { formatPrice } from '../../lib/utils.ts';

type Props = {
  property: PropertyData;
  onClick: () => void;
};

export function PropertyCard({ property, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={property.heroImage}
          alt={property.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-widest text-gray-500">{property.city}</p>
        <h3 className="font-display text-2xl mt-1 mb-2 text-gray-900">{property.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{property.shortDescription}</p>
        {property.pricePerNightHint && (
          <p className="mt-4 text-brand font-medium">
            Dès {formatPrice(property.pricePerNightHint)} / nuit
          </p>
        )}
      </div>
    </button>
  );
}
