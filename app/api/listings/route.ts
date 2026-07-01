import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/db/index';
import { realEstateAds, users } from '../../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { publishApprovedListing } from '../../../lib/publish';
import { listingCode, parseNumeric } from '../../../lib/format';

export const dynamic = 'force-dynamic';

function corsHeaders(_origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Preflight for cross-origin requests from the static main site
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

const DEAL_MAP: Record<string, string> = {
  'فروش': 'sale',         'sale': 'sale',
  'اجاره': 'rent',        'rent': 'rent',
  'رهن کامل': 'mortgage', 'رهن و اجاره': 'mortgage', 'mortgage': 'mortgage',
  'پیش‌فروش': 'presale',  'presale': 'presale',
  'اجاره شبانه': 'daily-rent', 'daily-rent': 'daily-rent',
};

function rowToListing(ad: any, advisor?: any) {
  // Strip internal phone/source notes added by bot-flow from the public description
  const rawDesc = ad.description ?? '';
  const desc = rawDesc
    .replace(/\s*\|\s*تماس:[^|]*/g, '')
    .replace(/\s*\|\s*منبع:[^|]*/g, '')
    .replace(/تماس:[^|]*/g, '')
    .trim()
    .replace(/^\|/, '')
    .trim();

  let images: string[] = [];
  if (ad.images) {
    try { images = JSON.parse(ad.images); } catch { images = []; }
  }
  if (images.length === 0 && ad.imageUrl) images = [ad.imageUrl];

  return {
    id: String(ad.id),
    code: listingCode(ad.id),
    title: ad.title,
    deal: DEAL_MAP[ad.type] ?? ad.type,
    propType: ad.type,
    price: ad.price != null ? String(ad.price) : '',
    size: ad.areaSize ?? 0,
    buildingArea: ad.buildingArea ?? 0,
    beds: ad.rooms ?? 0,
    phone: advisor?.phoneNumber ?? '',
    location: ad.location ?? '',
    imageUrl: images[0] ?? undefined,
    images,
    desc,
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
    const origin = req.headers.get('origin');
    return NextResponse.json({ listings }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// All public-facing listings show خانم حیدری as the contact — never راعی.
const MASK_PHONE = '09120996426';

// POST /api/listings → create a listing.
// Advisor submissions (submitter phone matches a registered user) publish immediately.
// Public (non-advisor) submissions stay pending for manager approval.
// ALL listings display خانم حیدری as the public contact — real phone stored in submitterPhone.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const storedSubmitterPhone = String(body.advisorPhone || body.phone || '') || null;

    // Advisor (insider) submissions auto-publish; public submissions need approval.
    const submitterUser = storedSubmitterPhone
      ? await db.select({ id: users.id }).from(users).where(eq(users.phoneNumber, storedSubmitterPhone))
      : [];
    const isAdvisorSubmission = submitterUser.length > 0;

    // Always assign خانم حیدری as the public-facing mask advisor.
    const maskAdvisor = await db.select().from(users).where(eq(users.phoneNumber, MASK_PHONE));

    let advisorId: number | null = null;
    if (maskAdvisor.length > 0) {
      advisorId = maskAdvisor[0].id;
    } else {
      const anyUser = await db.select().from(users).limit(1);
      if (anyUser.length > 0) advisorId = anyUser[0].id;
    }

    if (advisorId == null) {
      return NextResponse.json({ error: 'هیچ کاربری برای ثبت آگهی یافت نشد.' }, { status: 400 });
    }

    const priceNum = parseNumeric(body.price);
    const images: string[] = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    const coverImage = images[0] ?? body.imageUrl ?? null;

    const inserted = await db
      .insert(realEstateAds)
      .values({
        title: body.title ?? 'بدون عنوان',
        description: body.desc ?? '',
        price: priceNum,
        type: body.deal ?? body.propType ?? 'نامشخص',
        location: body.location ?? '',
        areaSize: Number(body.size) || 0,
        buildingArea: Number(body.buildingArea) || null,
        rooms: Number(body.beds) || 0,
        imageUrl: coverImage,
        images: images.length > 0 ? JSON.stringify(images) : null,
        submitterPhone: storedSubmitterPhone,
        publishStatus: 'pending',
        advisorId,
        isManagerApproved: isAdvisorSubmission,
      })
      .returning();

    const newId = inserted[0].id;
    if (isAdvisorSubmission) void publishApprovedListing(newId);

    return NextResponse.json({ id: String(newId) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
