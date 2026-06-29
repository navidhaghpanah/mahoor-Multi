import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/db/index';
import { realEstateAds, users } from '../../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { postListingToTelegram } from '../../../lib/telegram';
import { postListingToBale } from '../../../lib/bale';
import { postListingToKenar } from '../../../lib/kenar';

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

  return {
    id: String(ad.id),
    title: ad.title,
    deal: DEAL_MAP[ad.type] ?? ad.type,
    propType: ad.type,
    price: ad.price != null ? String(ad.price) : '',
    size: ad.areaSize ?? 0,
    beds: ad.rooms ?? 0,
    phone: advisor?.phoneNumber ?? '',
    location: ad.location ?? '',
    imageUrl: ad.imageUrl ?? undefined,
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

// Masking advisors for public submissions — alternates between Haydar and Raei
const MASK_PHONES = ['09120996426', '09120997453'];

// POST /api/listings → create a listing. ALL submissions saved as pending regardless of role.
// Manager-approve PATCH is the only path to published + Telegram/Bale hooks.
// ALL listings (advisor or public) display a Mahoor mask advisor (حیدری/راعی alternating).
// The real submitter phone is stored in submitterPhone for internal reference only.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Store real submitter phone internally regardless of who submitted
    const storedSubmitterPhone = String(body.advisorPhone || body.phone || '') || null;

    // Always assign a Mahoor mask advisor — alternates حیدری / راعی
    const countRows = await db
      .select({ id: realEstateAds.id })
      .from(realEstateAds)
      .where(eq(realEstateAds.isManagerApproved, false));
    const maskPhone = MASK_PHONES[countRows.length % MASK_PHONES.length];
    const maskAdvisor = await db.select().from(users).where(eq(users.phoneNumber, maskPhone));

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

    const priceNum = parseInt(String(body.price ?? '').replace(/[^0-9]/g, ''), 10) || 0;

    const inserted = await db
      .insert(realEstateAds)
      .values({
        title: body.title ?? 'بدون عنوان',
        description: body.desc ?? '',
        price: priceNum,
        type: body.deal ?? body.propType ?? 'نامشخص',
        location: body.location ?? '',
        areaSize: Number(body.size) || 0,
        rooms: Number(body.beds) || 0,
        imageUrl: body.imageUrl ?? null,
        submitterPhone: storedSubmitterPhone,
        publishStatus: 'pending',
        advisorId,
        isManagerApproved: false,  // ALL listings require manager approval
      })
      .returning();

    return NextResponse.json({ id: String(inserted[0].id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
