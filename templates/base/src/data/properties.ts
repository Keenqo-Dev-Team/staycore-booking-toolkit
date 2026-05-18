// Local presentation data for properties.
// `create-staycore-site` pre-fills this file by calling the PMS /properties
// endpoint at scaffold time, but you can edit it freely: anything you put here
// shows up on the public marketing site (hero images, copy, amenities).
//
// The `pmsPropertyId` field is the bridge to the booking engine — it must match
// the Property.id in the Stay'Core PMS.

import type { LucideIcon } from 'lucide-react';
import { Wifi, Bed, Bath, Coffee, Tv, Car, Snowflake, Sparkles } from 'lucide-react';

export type Amenity = {
  icon: LucideIcon;
  label: string;
};

export type PropertyData = {
  /** URL slug for /properties/{slug}. */
  slug: string;
  /** Property ID in the Stay'Core PMS — used for /book/.../properties/{id}/*. */
  pmsPropertyId: number;
  name: string;
  city: string;
  shortDescription: string;
  longDescription: string;
  heroImage: string;
  gallery: string[];
  pricePerNightHint?: number;
  amenities: Amenity[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  schema: {
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
    addressCountry: string;
    latitude: string;
    longitude: string;
    priceRange: string;
  };
};

/**
 * {{PROPERTIES_PLACEHOLDER}}
 * Replaced by the CLI at scaffold time. Edit freely — this is YOUR data.
 */
export const properties: PropertyData[] = [
  {
    slug: 'demo',
    pmsPropertyId: 1,
    name: 'Suite Démo',
    city: 'Paris',
    shortDescription: 'Une suite de démonstration. Remplace cette fiche par tes vraies données.',
    longDescription:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    heroImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80',
    ],
    pricePerNightHint: 140,
    amenities: [
      { icon: Wifi, label: 'WiFi haut débit' },
      { icon: Bed, label: 'Lit Queen Size' },
      { icon: Bath, label: 'Salle de bain privative' },
      { icon: Coffee, label: 'Cuisine équipée' },
      { icon: Tv, label: 'TV Netflix' },
      { icon: Car, label: 'Parking à proximité' },
      { icon: Snowflake, label: 'Climatisation' },
      { icon: Sparkles, label: 'Ménage inclus' },
    ],
    seo: {
      title: 'Suite Démo — Réservation directe',
      description: 'Réservez en direct, sans commission. Meilleur tarif garanti.',
      keywords: 'location courte durée, réservation directe',
    },
    schema: {
      streetAddress: '1 rue Démo',
      postalCode: '75001',
      addressLocality: 'Paris',
      addressCountry: 'FR',
      latitude: '48.8566',
      longitude: '2.3522',
      priceRange: '€€',
    },
  },
];

export function findPropertyBySlug(slug: string): PropertyData | undefined {
  return properties.find((p) => p.slug === slug);
}

export function findPropertyByPmsId(id: number): PropertyData | undefined {
  return properties.find((p) => p.pmsPropertyId === id);
}
