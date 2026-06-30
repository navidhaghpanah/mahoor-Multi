// Server-side only. Reads BALE_BOT_TOKEN + BALE_CHAT_ID from env.
// Bale uses a Telegram-compatible Bot API at https://tapi.bale.ai/
// If either env var is missing this is a complete no-op — never throws.

import type { ListingForTelegram } from './telegram';
import { formatPrice, formatNumber, toPersianDigits } from './format';

function buildCaption(l: ListingForTelegram): string {
  const lines: string[] = [
    `🏡 <b>${l.title}</b>`,
    l.code ? `🔖 کد آگهی: ${l.code}` : '',
    '',
    `💰 <b>قیمت:</b> ${formatPrice(l.price)}`,
    l.type         ? `🔑 <b>نوع:</b> ${l.type}`                                       : '',
    l.location     ? `📍 <b>موقعیت:</b> ${l.location}`                               : '',
    l.areaSize     ? `📐 <b>متراژ:</b> ${formatNumber(l.areaSize)} متر مربع`         : '',
    l.buildingArea ? `🏗 <b>متراژ بنا:</b> ${formatNumber(l.buildingArea)} متر مربع` : '',
    l.rooms        ? `🛏 <b>اتاق خواب:</b> ${toPersianDigits(l.rooms)}`              : '',
    '',
    `👤 <b>مشاور:</b> ${l.advisorName}`,
    l.advisorPhone ? `📱 ${toPersianDigits(l.advisorPhone)}` : '',
    '',
    '🏠 <i>مجموعه تخصصی املاک ماهور</i>',
    '☎️ ' + toPersianDigits('011-4473-5333'),
  ];
  return lines.filter(Boolean).join('\n');
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string; ext: string } {
  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const ext  = mime.split('/')[1] ?? 'jpg';
  const b64  = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
  return { blob: new Blob([bytes], { type: mime }), mime, ext };
}

export async function postListingToBale(listing: ListingForTelegram): Promise<void> {
  const token  = process.env.BALE_BOT_TOKEN;
  const chatId = process.env.BALE_CHAT_ID;
  if (!token || !chatId) return;

  const caption = buildCaption(listing);
  const apiBase = `https://tapi.bale.ai/bot${token}`;

  const photos = (listing.images ?? (listing.imageUrl ? [listing.imageUrl] : []))
    .filter(img => img?.startsWith('data:image/'));

  try {
    if (photos.length === 0) {
      const res = await fetch(`${apiBase}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'HTML' }),
      });
      if (!res.ok) console.error('[Bale] sendMessage failed:', await res.text());

    } else if (photos.length === 1) {
      const { blob, mime, ext } = dataUrlToBlob(photos[0]);
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');
      form.append('photo', blob, `listing.${ext}`);
      const res = await fetch(`${apiBase}/sendPhoto`, { method: 'POST', body: form });
      if (!res.ok) console.error('[Bale] sendPhoto failed:', await res.text());

    } else {
      // Bale is Telegram-compatible — try sendMediaGroup; fall back to sendPhoto on failure
      const batch = photos.slice(0, 10);
      const form  = new FormData();
      form.append('chat_id', chatId);

      const media = batch.map((img, i) => {
        const { blob, mime, ext } = dataUrlToBlob(img);
        const attachName = `photo${i}`;
        form.append(attachName, blob, `listing${i}.${ext}`);
        const entry: Record<string, string> = { type: 'photo', media: `attach://${attachName}` };
        if (i === 0) { entry.caption = caption; entry.parse_mode = 'HTML'; }
        return entry;
      });

      form.append('media', JSON.stringify(media));
      const res = await fetch(`${apiBase}/sendMediaGroup`, { method: 'POST', body: form });
      if (!res.ok) {
        // sendMediaGroup not supported — fall back to first photo only
        console.warn('[Bale] sendMediaGroup failed, falling back to sendPhoto');
        const { blob: fb, ext: fe } = dataUrlToBlob(photos[0]);
        const f2 = new FormData();
        f2.append('chat_id', chatId); f2.append('caption', caption);
        f2.append('parse_mode', 'HTML');
        f2.append('photo', fb, `listing.${fe}`);
        const r2 = await fetch(`${apiBase}/sendPhoto`, { method: 'POST', body: f2 });
        if (!r2.ok) console.error('[Bale] sendPhoto fallback failed:', await r2.text());
      }
    }
  } catch (e: any) {
    console.error('[Bale] post failed:', e?.message ?? e);
  }
}
