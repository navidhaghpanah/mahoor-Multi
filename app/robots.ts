import type { MetadataRoute } from 'next';

const APP_URL = 'https://app.mahoorrlste.ir';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
