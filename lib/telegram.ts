// Server-side only. Reads TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID from env.
// If either is missing this is a complete no-op — it never throws or breaks the
// listing publish flow.

export interface ListingForTelegram {
  title: string;
  price: number;
  type: string;
  location: string;
  areaSize: number;
  rooms: number;
  imageUrl?: string | null;
  advisorName: string;
  advisorPhone: string;
}

function formatPrice(p: number): string {
  if (!p || p <= 0) return 'توافقی';
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' تومان';
}

function buildCaption(l: ListingForTelegram): string {
  const lines: string[] = [
    `🏡 <b>${l.title}</b>`,
    '',
    `💰 <b>قیمت:</b> ${formatPrice(l.price)}`,
    l.type       ? `🔑 <b>نوع:</b> ${l.type}`                       : '',
    l.location   ? `📍 <b>موقعیت:</b> ${l.location}`               : '',
    l.areaSize   ? `📐 <b>متراژ:</b> ${l.areaSize} متر مربع`       : '',
    l.rooms      ? `🛏 <b>اتاق خواب:</b> ${l.rooms}`               : '',
    '',
    `👤 <b>مشاور:</b> ${l.advisorName}`,
    l.advisorPhone ? `📱 ${l.advisorPhone}`                         : '',
    '',
    '🏠 <i>مجموعه تخصصی املاک ماهور</i>',
    '☎️ 011-4473-5333',
  ];
  return lines.filter(Boolean).join('\n');
}

export async function postListingToTelegram(listing: ListingForTelegram): Promise<void> {
  const token     = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) return; // not configured yet — no-op

  const caption  = buildCaption(listing);
  const apiBase  = `https://api.telegram.org/bot${token}`;

  try {
    if (listing.imageUrl?.startsWith('data:image/')) {
      const mimeMatch = listing.imageUrl.match(/^data:(image\/\w+);base64,/);
      const mime      = mimeMatch?.[1] ?? 'image/jpeg';
      const ext       = mime.split('/')[1] ?? 'jpg';
      const b64       = listing.imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer    = Buffer.from(b64, 'base64');

      const form = new FormData();
      form.append('chat_id', channelId);
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');
      form.append('photo', new Blob([buffer], { type: mime }), `listing.${ext}`);

      const res = await fetch(`${apiBase}/sendPhoto`, { method: 'POST', body: form });
      if (!res.ok) console.error('[Telegram] sendPhoto failed:', await res.text());
    } else {
      // No image: fall back to text message
      const res = await fetch(`${apiBase}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: channelId, text: caption, parse_mode: 'HTML' }),
      });
      if (!res.ok) console.error('[Telegram] sendMessage failed:', await res.text());
    }
  } catch (e: any) {
    console.error('[Telegram] post failed:', e?.message ?? e);
    // intentionally swallowed — never breaks the caller
  }
}
