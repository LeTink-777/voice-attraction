import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;
  const lastModified = new Date();

  return [
    { url: `${base}/`, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/offer`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
