import type { MetadataRoute } from 'next';
import { db } from '../src/db/index';
import { realEstateAds } from '../src/db/schema';
import { and, eq } from 'drizzle-orm';

const APP_URL = 'https://app.mahoorrlste.ir';

export const dynamic = 'force-dynamic';

function listingSlug(id: number): string {
  return 'MH-' + String(id).padStart(4, '0');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await db
    .select({ id: realEstateAds.id, timestamp: realEstateAds.timestamp })
    .from(realEstateAds)
    .where(and(eq(realEstateAds.isManagerApproved, true), eq(realEstateAds.isActive, true)));

  const listingEntries: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${APP_URL}/p/${listingSlug(row.id)}`,
    lastModified: row.timestamp ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${APP_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...listingEntries,
  ];
}
