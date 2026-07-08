// Serves a listing image as a real HTTP image response with Mahoor watermark.
// ?i=N selects from the images[] array (default 0). Falls back to imageUrl.
// Watermark is composited at serve-time (non-destructive); originals in DB are unchanged.
// Cache-Control: immutable so CDN/Vercel pays the sharp cost only once per image.
import { NextRequest, NextResponse } from 'next/server';
import { watermarkImageBuffer } from '../../../../lib/watermark';
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
    })
    .from(realEstateAds)
    .where(eq(realEstateAds.id, id));

  if (!rows.length) return new NextResponse(null, { status: 404 });

  let dataUrl = '';
  if (rows[0].images) {
    try {
      const arr = JSON.parse(rows[0].images) as string[];
      dataUrl = arr[idx] ?? arr[0] ?? '';
    } catch {}
  }
  if (!dataUrl) dataUrl = rows[0].imageUrl ?? '';

  if (!dataUrl.startsWith('data:image/')) return new NextResponse(null, { status: 404 });

  const imgBuf = Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  const output = await watermarkImageBuffer(imgBuf);

  return new NextResponse(new Uint8Array(output), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Length': String(output.length),
    },
  });
}