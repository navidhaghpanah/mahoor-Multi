// Serves a listing image as a real HTTP image response.
// ?i=N selects from the images[] array (default 0). Falls back to imageUrl.
// Used for og:image, hero, and thumbnail grid — no raw base64 in HTML.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (!id) return new NextResponse(null, { status: 404 });

  const idx = parseInt(req.nextUrl.searchParams.get('i') ?? '0', 10) || 0;

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
    try {
      const arr = JSON.parse(rows[0].images) as string[];
      dataUrl = arr[idx] ?? arr[0] ?? '';
    } catch {}
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
