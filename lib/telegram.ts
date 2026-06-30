// Server-side only. Reads TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID from env.
// If either is missing this is a complete no-op — it never throws or breaks the
// listing publish flow.

import { formatPrice, formatNumber, toPersianDigits } from './format';

export interface ListingForTelegram {
  title: string;
  price: number;
  type: string;
  location: string;
  areaSize: number;
  buildingArea?: number;
  rooms: number;
  imageUrl?: string | null;
  images?: string[];
  code?: string;
  advisorName: string;
  advisorPhone: string;
}

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
  // Uint8Array.from() allocates a fresh ArrayBuffer (not SharedArrayBuffer),
  // which satisfies the Blob constructor's BlobPart type constraint.
  const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
  return { blob: new Blob([bytes], { type: mime }), mime, ext };
}

export async function postListingToTelegram(listing: ListingForTelegram): Promise<void> {
  const token     = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) return;

  const caption = buildCaption(listing);
  const apiBase = `https://api.telegram.org/bot${token}`;

  // Collect all valid base64 images
  const photos = (listing.images ?? (listing.imageUrl ? [listing.imageUrl] : []))
    .filter(img => img?.startsWith('data:image/'));

  try {
    if (photos.length === 0) {
      // No images — send text only
      const res = await fetch(`${apiBase}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: channelId, text: caption, parse_mode: 'HTML' }),
      });
      if (!res.ok) console.error('[Telegram] sendMessage failed:', await res.text());

    } else if (photos.length === 1) {
      // Single image — sendPhoto
      const { blob, mime, ext } = dataUrlToBlob(photos[0]);
      const form = new FormData();
      form.append('chat_id', channelId);
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');
      form.append('photo', blob, `listing.${ext}`);
      const res = await fetch(`${apiBase}/sendPhoto`, { method: 'POST', body: form });
      if (!res.ok) console.error('[Telegram] sendPhoto failed:', await res.text());

    } else {
      // Multiple images — sendMediaGroup (up to 10)
      const batch = photos.slice(0, 10);
      const form  = new FormData();
      form.append('chat_id', channelId);

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
      if (!res.ok) console.error('[Telegram] sendMediaGroup failed:', await res.text());
    }
  } catch (e: any) {
    console.error('[Telegram] post failed:', e?.message ?? e);
  }
}
