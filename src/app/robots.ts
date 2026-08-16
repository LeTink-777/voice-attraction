import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/result', '/thank-you', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
