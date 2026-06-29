import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds, users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';
import { postListingToTelegram } from '../../../../lib/telegram';

// PATCH /api/listings/:id  -> update fields (e.g. imageUrl) on a listing
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, any> = {};
    if (body.approve === true) updates.isManagerApproved = true;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    await db.update(realEstateAds).set(updates).where(eq(realEstateAds.id, Number(id)));

    // Fire-and-forget Telegram post when a public listing is manager-approved
    if (body.approve === true) {
      void (async () => {
        try {
          const rows = await db
            .select()
            .from(realEstateAds)
            .leftJoin(users, eq(realEstateAds.advisorId, users.id))
            .where(eq(realEstateAds.id, Number(id)));
          if (rows.length > 0) {
            const ad     = rows[0].real_estate_ads;
            const advisor = rows[0].users;
            await postListingToTelegram({
              title:        ad.title,
              price:        Number(ad.price),
              type:         ad.type,
              location:     ad.location ?? '',
              areaSize:     ad.areaSize ?? 0,
              rooms:        ad.rooms ?? 0,
              imageUrl:     ad.imageUrl,
              advisorName:  advisor?.fullName ?? 'کارشناس ماهور',
              advisorPhone: advisor?.phoneNumber ?? '',
            });
          }
        } catch (e: any) {
          console.error('[Telegram] post-on-approve failed:', e?.message);
        }
      })();
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/listings/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(realEstateAds).where(eq(realEstateAds.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

