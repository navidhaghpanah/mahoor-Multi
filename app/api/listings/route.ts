import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/db/index';
import { realEstateAds, users } from '../../../src/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Map a DB row (real_estate_ads + advisor) to the client Listing shape.
function rowToListing(ad: any, advisor?: any) {
  return {
    id: String(ad.id),
    title: ad.title,
    deal: ad.type,
    propType: ad.type,
    price: ad.price != null ? String(ad.price) : '',
    size: ad.areaSize ?? 0,
    beds: ad.rooms ?? 0,
    phone: advisor?.phoneNumber ?? '',
    location: ad.location ?? '',
    imageUrl: ad.imageUrl ?? undefined,
    desc: ad.description ?? '',
    advisorName: advisor?.fullName ?? 'کارشناس ماهور',
    advisorPhone: advisor?.phoneNumber ?? '',
    status: ad.isManagerApproved ? 'approved' : 'pending',
    createdAt: ad.timestamp,
  };
}

// GET /api/listings  -> list of all listings (newest first)
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(realEstateAds)
      .leftJoin(users, eq(realEstateAds.advisorId, users.id))
      .orderBy(desc(realEstateAds.timestamp));

    const listings = rows.map((r: any) => rowToListing(r.real_estate_ads, r.users));
    return NextResponse.json({ listings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/listings  -> create a new listing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Resolve advisor id from the provided phone (falls back to first manager).
    let advisorId: number | null = null;
    if (body.advisorPhone || body.phone) {
      const phone = String(body.advisorPhone || body.phone);
      const matched = await db.select().from(users).where(eq(users.phoneNumber, phone));
      if (matched.length > 0) advisorId = matched[0].id;
    }
    if (advisorId == null) {
      const anyUser = await db.select().from(users).limit(1);
      if (anyUser.length > 0) advisorId = anyUser[0].id;
    }
    if (advisorId == null) {
      return NextResponse.json({ error: 'هیچ کاربری برای ثبت آگهی یافت نشد.' }, { status: 400 });
    }

    const priceNum = parseInt(String(body.price ?? '').replace(/[^0-9]/g, ''), 10) || 0;

    const inserted = await db
      .insert(realEstateAds)
      .values({
        title: body.title ?? 'بدون عنوان',
        description: body.desc ?? '',
        price: priceNum,
        type: body.propType ?? body.deal ?? 'نامشخص',
        location: body.location ?? '',
        areaSize: Number(body.size) || 0,
        rooms: Number(body.beds) || 0,
        imageUrl: body.imageUrl ?? null,
        publishStatus: 'pending',
        advisorId,
        isManagerApproved: false,
      })
      .returning();

    return NextResponse.json({ id: String(inserted[0].id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

