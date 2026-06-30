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

export async function postListingToBale(listing: ListingForTelegram): Promise<void> {
  const token  = process.env.BALE_BOT_TOKEN;
  const chatId = process.env.BALE_CHAT_ID;
  if (!token || !chatId) return; // not configured yet — no-op

  const caption = buildCaption(listing);
  const apiBase = `https://tapi.bale.ai/bot${token}`;

  try {
    if (listing.imageUrl?.startsWith('data:image/')) {
      const mimeMatch = listing.imageUrl.match(/^data:(image\/\w+);base64,/);
      const mime      = mimeMatch?.[1] ?? 'image/jpeg';
      const ext       = mime.split('/')[1] ?? 'jpg';
      const b64       = listing.imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer    = Buffer.from(b64, 'base64');

      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');
      form.append('photo', new Blob([buffer], { type: mime }), `listing.${ext}`);

      const res = await fetch(`${apiBase}/sendPhoto`, { method: 'POST', body: form });
      if (!res.ok) console.error('[Bale] sendPhoto failed:', await res.text());
    } else {
      const res = await fetch(`${apiBase}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'HTML' }),
      });
      if (!res.ok) console.error('[Bale] sendMessage failed:', await res.text());
    }
  } catch (e: any) {
    console.error('[Bale] post failed:', e?.message ?? e);
    // intentionally swallowed — never breaks the caller
  }
}
