import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

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

