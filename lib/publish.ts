// Shared "publish an approved listing to all channels" — used by manager-approve
// (PATCH /api/listings/:id) and by auto-approve paths (advisor submissions via
// app or Telegram/Bale bot) so both follow the exact same channel-post logic.

import { db } from '../src/db/index';
import { realEstateAds, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { postListingToTelegram } from './telegram';
import { postListingToBale } from './bale';
import { postListingToKenar } from './kenar';
import { listingCode } from './format';

export async function publishApprovedListing(adId: number): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(realEstateAds)
      .leftJoin(users, eq(realEstateAds.advisorId, users.id))
      .where(eq(realEstateAds.id, adId));
    if (!rows.length) return;

    const ad = rows[0].real_estate_ads;
    const advisor = rows[0].users;

    let images: string[] = [];
    if (ad.images) {
      try { images = JSON.parse(ad.images); } catch { images = []; }
    }
    if (images.length === 0 && ad.imageUrl) images = [ad.imageUrl];

    const payload = {
      title:        ad.title,
      price:        Number(ad.price),
      type:         ad.type,
      location:     ad.location ?? '',
      areaSize:     ad.areaSize ?? 0,
      buildingArea: ad.buildingArea ?? 0,
      rooms:        ad.rooms ?? 0,
      imageUrl:     images[0] ?? ad.imageUrl,
      images,
      code:         listingCode(ad.id),
      advisorName:  advisor?.fullName ?? 'کارشناس ماهور',
      advisorPhone: advisor?.phoneNumber ?? '',
    };

    await postListingToTelegram(payload);
    await postListingToBale(payload);
    await postListingToKenar({ ...payload, lat: null, lng: null });
  } catch (e: any) {
    console.error('[publish] failed:', e?.message ?? e);
  }
}
