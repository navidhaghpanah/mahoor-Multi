import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';
import { publishApprovedListing } from '../../../../lib/publish';
import { getAuthedUser } from '../../../../lib/session';

// Approve/reject actions are manager-only; everything else (edit own listing,
// append a photo, mark a manual-publish link) is allowed for the listing's
// owner too — either the registered advisor it belongs to, or the phone that
// originally submitted it (covers public, non-advisor submissions where
// advisorId is masked to حیدری before the submitter finishes their upload).
async function canMutate(
  id: number,
  auth: { userId: number | null; phone: string; isManager: boolean } | null
): Promise<boolean> {
  if (!auth) return false;
  if (auth.isManager) return true;
  const rows = await db
    .select({ advisorId: realEstateAds.advisorId, submitterPhone: realEstateAds.submitterPhone })
    .from(realEstateAds)
    .where(eq(realEstateAds.id, id));
  if (!rows.length) return false;
  return rows[0].advisorId === auth.userId || rows[0].submitterPhone === auth.phone;
}

// PATCH /api/listings/:id  -> update fields (e.g. imageUrl) on a listing
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const body = await req.json();

    const auth = await getAuthedUser(req);

    if (body.approve === true) {
      if (!auth?.isManager) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    } else if (!(await canMutate(numId, auth))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const updates: Record<string, any> = {};

    // Append a single image (small request — used by the web form to upload
    // photos one by one instead of a single huge POST that flaky uplinks drop)
    if (typeof body.appendImage === 'string' && body.appendImage.startsWith('data:image/')) {
      const rows = await db.select({ images: realEstateAds.images, imageUrl: realEstateAds.imageUrl })
        .from(realEstateAds).where(eq(realEstateAds.id, Number(id)));
      if (!rows.length) return NextResponse.json({ error: 'not found' }, { status: 404 });
      let imgs: string[] = [];
      try { imgs = rows[0].images ? JSON.parse(rows[0].images) : []; } catch {}
      if (imgs.length === 0 && rows[0].imageUrl) imgs = [rows[0].imageUrl];
      imgs.push(body.appendImage);
      updates.images = JSON.stringify(imgs);
    }
    if (body.approve === true) updates.isManagerApproved = true;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.images !== undefined) updates.images = Array.isArray(body.images) ? JSON.stringify(body.images) : null;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined) updates.price = Number(body.price) || 0;
    if (body.location !== undefined) updates.location = body.location;
    if (body.areaSize !== undefined) updates.areaSize = Number(body.areaSize) || 0;
    if (body.buildingArea !== undefined) updates.buildingArea = Number(body.buildingArea) || null;
    if (body.rooms !== undefined) updates.rooms = Number(body.rooms) || 0;
    if (body.documents !== undefined) updates.documents = body.documents ? String(body.documents) : null;
    if (body.submitterPhone !== undefined) updates.submitterPhone = body.submitterPhone;
    if (body.externalPublications !== undefined) {
      updates.externalPublications =
        body.externalPublications && typeof body.externalPublications === 'object'
          ? JSON.stringify(body.externalPublications)
          : null;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(realEstateAds).set(updates).where(eq(realEstateAds.id, Number(id)));
    }

    // Fire-and-forget channel post when a listing is (manager- or auto-)approved.
    // publishNow: used by the web form after all photos are uploaded, so the
    // channel post includes the full gallery (only fires if already approved).
    if (body.approve === true) {
      void publishApprovedListing(Number(id));
    } else if (body.publishNow === true) {
      const rows = await db.select({ approved: realEstateAds.isManagerApproved })
        .from(realEstateAds).where(eq(realEstateAds.id, Number(id)));
      if (rows[0]?.approved) void publishApprovedListing(Number(id));
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/listings/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const auth = await getAuthedUser(req);
    if (!(await canMutate(numId, auth))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    await db.delete(realEstateAds).where(eq(realEstateAds.id, numId));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

