import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = 'https://edulens.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
} 