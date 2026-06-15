import type { Amenity } from '../../data/properties.ts';

type Props = {
  amenities: Amenity[];
};

export function AmenitiesGrid({ amenities }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {amenities.map((a) => {
        const Icon = a.icon;
        return (
          <div key={a.label} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100">
            <Icon className="w-5 h-5 text-brand flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-gray-800">{a.label}</span>
          </div>
        );
      })}
    </div>
  );
}
