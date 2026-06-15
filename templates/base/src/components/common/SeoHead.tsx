import { useEffect } from 'react';

type Props = {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
};

/**
 * Tiny SEO helper. Sets <title>, meta description, OG tags imperatively.
 * For server-rendered SEO, swap to react-helmet-async or Next.js metadata.
 */
export function SeoHead({ title, description, keywords, image, url }: Props) {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);

    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    if (image) setMeta('og:image', image, true);
    if (url) setMeta('og:url', url, true);
    setMeta('og:type', 'website', true);

    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);
  }, [title, description, keywords, image, url]);

  return null;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}
