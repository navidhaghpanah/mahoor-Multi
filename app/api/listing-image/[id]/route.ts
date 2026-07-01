// Serves a listing's first image as a real HTTP response so it can be used as og:image.
// Base64 data URLs can't be og:image URLs — this route bridges the gap.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (!id) return new NextResponse(null, { status: 404 });

  const rows = await db
    .select({
      images:   realEstateAds.images,
      imageUrl: realEstateAds.imageUrl,
      approved: realEstateAds.isManagerApproved,
    })
    .from(realEstateAds)
    .where(eq(realEstateAds.id, id));

  if (!rows.length || !rows[0].approved) return new NextResponse(null, { status: 404 });

  let dataUrl = '';
  if (rows[0].images) {
    try { dataUrl = (JSON.parse(rows[0].images) as string[])[0] ?? ''; } catch {}
  }
  if (!dataUrl) dataUrl = rows[0].imageUrl ?? '';

  if (!dataUrl.startsWith('data:image/')) return new NextResponse(null, { status: 404 });

  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const b64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(b64, 'base64');

  return new NextResponse(buf, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Length': String(buf.length),
    },
  });
}
