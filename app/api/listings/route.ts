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

// Some submissions store the phone with Persian digits (e.g. ۰۹۱۲…) — normalize for comparison
function normalizePhone(p: string | null | undefined): string {
  return String(p ?? '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

function rowToListing(ad: any, advisor?: any, advisorPhones?: Set<string>) {
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
    submitterPhone: ad.submitterPhone ?? null,
    // Public submission = submitter phone doesn't belong to any registered advisor
    isPublicSubmission: advisorPhones
      ? !!ad.submitterPhone && !advisorPhones.has(normalizePhone(ad.submitterPhone))
      : false,
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

    const allUsers = await db.select({ phone: users.phoneNumber }).from(users);
    const advisorPhones = new Set(allUsers.map((u: any) => normalizePhone(u.phone)).filter(Boolean));

    const listings = rows.map((r: any) => rowToListing(r.real_estate_ads, r.users, advisorPhones));
    const origin = req.headers.get('origin');
    return NextResponse.json({ listings }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// راعی's listings are displayed under حیدری's identity.
// All other advisors show their own name/phone. Public submissions default to حیدری.
const RAEI_PHONE   = '09120997453';
const HAYDAR_PHONE = '09120996426';

// POST /api/listings → create a listing.
// Advisor submissions (submitter phone matches a registered user) publish immediately.
// Public (non-advisor) submissions stay pending for manager approval.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const storedSubmitterPhone = String(body.advisorPhone || body.phone || '') || null;

    // Fetch the submitter's full user row (if they are a registered advisor).
    const submitterRows = storedSubmitterPhone
      ? await db.select().from(users).where(eq(users.phoneNumber, storedSubmitterPhone))
      : [];
    const isAdvisorSubmission = submitterRows.length > 0;
    const submitterUser = submitterRows[0] ?? null;

    // Determine public-facing advisor:
    //   راعی → show as حیدری  |  public (no row) → حیدری  |  everyone else → own row
    const needsMask = !submitterUser || submitterUser.phoneNumber === RAEI_PHONE;

    let advisorId: number | null = null;
    if (needsMask) {
      const haydar = await db.select().from(users).where(eq(users.phoneNumber, HAYDAR_PHONE));
      if (haydar.length > 0) {
        advisorId = haydar[0].id;
      } else {
        const anyUser = await db.select().from(users).limit(1);
        if (anyUser.length > 0) advisorId = anyUser[0].id;
      }
    } else {
      advisorId = submitterUser!.id;
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
