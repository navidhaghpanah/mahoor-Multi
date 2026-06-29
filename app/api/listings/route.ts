import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/db/index';
import { realEstateAds, users } from '../../../src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { postListingToTelegram } from '../../../lib/telegram';

export const dynamic = 'force-dynamic';

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

// GET /api/listings           → approved listings only (public feed)
// GET /api/listings?status=pending → pending listings (manager approval queue)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const condition = statusFilter === 'pending'
      ? eq(realEstateAds.isManagerApproved, false)
      : eq(realEstateAds.isManagerApproved, true);

    const rows = await db
      .select()
      .from(realEstateAds)
      .leftJoin(users, eq(realEstateAds.advisorId, users.id))
      .where(condition)
      .orderBy(desc(realEstateAds.timestamp));

    const listings = rows.map((r: any) => rowToListing(r.real_estate_ads, r.users));
    return NextResponse.json({ listings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/listings → create a listing.
// If the submitter's phone is registered as an insider (advisor/manager),
// auto-approve (isManagerApproved = true). Otherwise set pending.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const submitterPhone = String(body.advisorPhone || body.phone || '');
    let advisorId: number | null = null;
    let isInsider = false;
    let matchedAdvisorName = '';
    let matchedAdvisorPhone = '';

    // Try to match the submitter's phone to a registered user
    if (submitterPhone) {
      const matched = await db.select().from(users).where(eq(users.phoneNumber, submitterPhone));
      if (matched.length > 0) {
        advisorId           = matched[0].id;
        isInsider           = true;
        matchedAdvisorName  = matched[0].fullName;
        matchedAdvisorPhone = matched[0].phoneNumber;
      }
    }

    // Public submission: still needs a valid advisorId FK — use the manager as nominal owner
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
        publishStatus: isInsider ? 'published' : 'pending',
        advisorId,
        isManagerApproved: isInsider,   // insiders publish immediately
      })
      .returning();

    // Fire-and-forget Telegram post for insider (auto-approved) listings
    if (isInsider) {
      void postListingToTelegram({
        title:        body.title ?? 'بدون عنوان',
        price:        priceNum,
        type:         body.propType ?? body.deal ?? '',
        location:     body.location ?? '',
        areaSize:     Number(body.size) || 0,
        rooms:        Number(body.beds) || 0,
        imageUrl:     body.imageUrl ?? null,
        advisorName:  matchedAdvisorName,
        advisorPhone: matchedAdvisorPhone,
      });
    }

    return NextResponse.json({ id: String(inserted[0].id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
