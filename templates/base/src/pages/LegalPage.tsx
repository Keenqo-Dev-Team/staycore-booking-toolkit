import { SeoHead } from '../components/common/SeoHead.tsx';
import { BRAND_NAME } from '../config.ts';

type Props = {
  kind: 'legal' | 'cgv' | 'privacy';
};

const PAGES = {
  legal: {
    title: 'Mentions légales',
    body: `Page à compléter par l'éditeur du site : raison sociale, capital, SIRET, RCS, directeur de publication, hébergeur, etc.`,
  },
  cgv: {
    title: 'Conditions générales de vente',
    body: `Page à compléter par l'éditeur du site : conditions de réservation, paiement, annulation, caution, responsabilité, etc.`,
  },
  privacy: {
    title: 'Politique de confidentialité',
    body: `Page à compléter par l'éditeur du site : données collectées, finalités, base légale, durée de conservation, droits RGPD, contact DPO.`,
  },
};

export function LegalPage({ kind }: Props) {
  const page = PAGES[kind];

  return (
    <>
      <SeoHead title={`${page.title} — ${BRAND_NAME}`} description={page.title} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-display text-4xl mb-6 text-gray-900">{page.title}</h1>
        <div className="prose text-gray-800 whitespace-pre-line">{page.body}</div>
      </section>
    </>
  );
}
