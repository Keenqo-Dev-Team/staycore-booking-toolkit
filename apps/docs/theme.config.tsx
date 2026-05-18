import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
      <span style={{ color: '#C9A84C' }}>STAYCORE</span> Direct Booking Toolkit
    </span>
  ),
  project: {
    link: 'https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit',
  },
  docsRepositoryBase:
    'https://github.com/Keenqo-Dev-Team/staycore-booking-toolkit/tree/main/apps/docs',
  footer: {
    content: (
      <span>
        MIT © {new Date().getFullYear()}{' '}
        <a href="https://keenqo.fr" target="_blank" rel="noopener noreferrer">
          Keenqo
        </a>{' '}
        — <a href="https://stay-core.com">Stay'Core</a>
      </span>
    ),
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="STAYCORE Direct Booking Toolkit" />
      <meta
        property="og:description"
        content="Scaffolde un site de réservation directe sur-mesure intégré au PMS Stay'Core — SDK, CLI npx, Claude Code Skill."
      />
    </>
  ),
};

export default config;
