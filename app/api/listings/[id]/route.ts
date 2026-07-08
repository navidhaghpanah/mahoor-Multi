import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';
import { publishApprovedListing } from '../../../../lib/publish';

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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    await db.update(realEstateAds).set(updates).where(eq(realEstateAds.id, Number(id)));

    // Fire-and-forget channel post when a listing is (manager- or auto-)approved
    if (body.approve === true) void publishApprovedListing(Number(id));

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

