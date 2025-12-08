import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://edulens.app';

  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/marketplace`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/scholarships`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/signin`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
