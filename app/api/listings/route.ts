import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/db/index';
import { realEstateAds, users } from '../../../src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { postListingToTelegram } from '../../../lib/telegram';
import { postListingToBale } from '../../../lib/bale';
import { postListingToKenar } from '../../../lib/kenar';

export const dynamic = 'force-dynamic';

const CORS_ORIGINS = ['https://mahoorrlste.ir', 'http://mahoorrlste.ir'];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Preflight for cross-origin requests from the static main site
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

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
// Public submitter's real phone is stored in submitterPhone for office reference;
// the public-displayed contact is masked to a Mahoor advisor number.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const submitterPhone = String(body.advisorPhone || body.phone || '');
    let advisorId: number | null = null;
    let isInsider = false;
    let storedSubmitterPhone: string | null = null;

    // Try to match the submitter's phone to a registered insider
    if (submitterPhone) {
      const matched = await db.select().from(users).where(eq(users.phoneNumber, submitterPhone));
      if (matched.length > 0) {
        advisorId = matched[0].id;
        isInsider = true;
      }
    }

    // Public submission: mask contact to alternating Mahoor advisor
    if (!isInsider) {
      storedSubmitterPhone = submitterPhone || null;
      // Count existing public submissions to alternate the mask advisor
      const countRows = await db
        .select({ id: realEstateAds.id })
        .from(realEstateAds)
        .where(eq(realEstateAds.isManagerApproved, false));
      const maskPhone = MASK_PHONES[countRows.length % MASK_PHONES.length];
      const maskAdvisor = await db.select().from(users).where(eq(users.phoneNumber, maskPhone));
      if (maskAdvisor.length > 0) {
        advisorId = maskAdvisor[0].id;
      } else {
        // Fallback: any user
        const anyUser = await db.select().from(users).limit(1);
        if (anyUser.length > 0) advisorId = anyUser[0].id;
      }
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
