import type { DocsThemeConfig } from 'nextra-theme-docs';
import { useRouter } from 'next/router';

const SITE_URL = 'https://dbt-docs.stay-core.com';
const SITE_NAME = 'Stay’Core Direct Booking Toolkit';
const SITE_TAGLINE = 'Sites de réservation directe intégrés au PMS Stay’Core. SDK TypeScript, CLI npx, Skill Claude Code. Zéro commission Airbnb / Booking.';
const SITE_KEYWORDS = [
  'réservation directe staycore',
  'staycore booking',
  'staycore PMS',
  'réservation directe location courte durée',
  'site web réservation directe',
  'moteur de réservation conciergerie',
  '@staycore/booking-sdk',
  'create-staycore-site',
  'sans commission Airbnb Booking',
  'Channel Manager réservation directe',
].join(', ');

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <img
        src="/favicon.svg"
        alt="Stay’Core"
        width={28}
        height={28}
        style={{ borderRadius: 6 }}
      />
      <span style={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: '0.95rem' }}>
        <span style={{ color: '#C9A84C' }}>STAYCORE</span>{' '}
        <span style={{ opacity: 0.7 }}>Direct Booking Toolkit</span>
      </span>
    </div>
  ),
  logoLink: '/',

  project: {
    link: 'https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit',
  },

  docsRepositoryBase:
    'https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit/tree/main/apps/docs',

  footer: {
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span>
          MIT © {new Date().getFullYear()}{' '}
          <a href="https://keenqo.fr" target="_blank" rel="noopener noreferrer">
            Keenqo
          </a>
          {' — '}
          <a href="https://stay-core.com" target="_blank" rel="noopener noreferrer">
            Stay’Core PMS
          </a>
        </span>
        <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>
          Réservation directe sans commission — moteur de réservation officiel Stay’Core
        </span>
      </div>
    ),
  },

  head: () => {
    const { asPath, locale } = useRouter();
    const url = `${SITE_URL}${asPath === '/' ? '' : asPath}`;
    const ogImage = `${SITE_URL}/og-image.svg`;
    const title = SITE_NAME + ' — Réservation directe staycore';

    const websiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: locale ?? 'fr-FR',
      description: SITE_TAGLINE,
      publisher: {
        '@type': 'Organization',
        name: 'Stay’Core',
        url: 'https://stay-core.com',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/staycore-icon.png`,
        },
      },
    };

    const softwareJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Node.js 20+, Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      description: SITE_TAGLINE,
      url: SITE_URL,
      softwareVersion: '0.2.0',
      license: 'https://opensource.org/licenses/MIT',
    };

    return (
      <>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="description" content={SITE_TAGLINE} />
        <meta name="keywords" content={SITE_KEYWORDS} />
        <meta name="author" content="Keenqo — Stay’Core" />
        <link rel="canonical" href={url} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/staycore-icon.png" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={SITE_TAGLINE} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={SITE_TAGLINE} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </>
    );
  },
};

export default config;
