import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
};

export function Gallery({ images, alt }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className={`overflow-hidden rounded-xl bg-gray-100 ${
              i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
          >
            <img
              src={src}
              alt={`${alt} — photo ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-label="Galerie photos"
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Fermer"
            className="absolute top-6 right-6 text-white p-2"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <button
            type="button"
            aria-label="Précédent"
            className="absolute left-6 text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
            }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img
            src={images[lightboxIndex] ?? images[0]}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Suivant"
            className="absolute right-6 text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
            }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </>
  );
}
