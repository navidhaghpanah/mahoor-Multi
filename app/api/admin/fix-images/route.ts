import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds } from '../../../../src/db/schema';
import { eq, like } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// One-time admin fix: re-download any listing image stored as a raw
// `tg://file_id/<id>` (legacy pre-fix bot submissions) and replace it with a
// real base64 data URL. If the file is no longer downloadable (Telegram file
// IDs can expire), the field is cleared so the UI falls back to a placeholder
// instead of a broken <img>.
async function downloadPhoto(bot: string, fileId: string): Promise<string | null> {
  const token = bot === 'bale' ? process.env.BALE_BOT_TOKEN : process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const apiBase = bot === 'bale' ? `https://tapi.bale.ai/bot${token}` : `https://api.telegram.org/bot${token}`;
  try {
    const meta = await fetch(`${apiBase}/getFile?file_id=${fileId}`).then(r => r.json());
    if (!meta.ok) return null;
    const filePath: string = meta.result.file_path;
    const fileBase = bot === 'bale' ? `https://tapi.bale.ai/file/bot${token}` : `https://api.telegram.org/file/bot${token}`;
    const imgRes = await fetch(`${fileBase}/${filePath}`);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.WEBHOOK_SETUP_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const broken = await db.select().from(realEstateAds).where(like(realEstateAds.imageUrl, 'tg://%'));
  const results: any[] = [];

  for (const ad of broken) {
    const fileId = (ad.imageUrl ?? '').replace('tg://file_id/', '');
    const bot = ad.source === 'bale' ? 'bale' : 'telegram';
    const dataUrl = await downloadPhoto(bot, fileId);
    await db.update(realEstateAds).set({ imageUrl: dataUrl }).where(eq(realEstateAds.id, ad.id));
    results.push({ id: ad.id, fixed: !!dataUrl, newImageLength: dataUrl?.length ?? 0 });
  }

  return NextResponse.json({ scanned: broken.length, results });
}
