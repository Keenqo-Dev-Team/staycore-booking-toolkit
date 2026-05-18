import { BRAND_NAME, BRAND_TAGLINE } from '../../config.ts';

type Props = {
  onCta: () => void;
  image?: string;
};

export function Hero({ onCta, image }: Props) {
  return (
    <section className="relative overflow-hidden">
      {image && (
        <div className="absolute inset-0 -z-10">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-48 text-center text-white">
        <h1 className="font-display text-5xl sm:text-7xl mb-6 drop-shadow-lg">{BRAND_NAME}</h1>
        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 drop-shadow">{BRAND_TAGLINE}</p>
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center px-8 py-4 rounded-full bg-brand text-brand-contrast text-base font-medium hover:bg-brand-dark transition-colors shadow-lg"
        >
          Réserver en direct
        </button>
      </div>
    </section>
  );
}
