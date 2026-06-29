import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.WEBHOOK_SETUP_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });

  const webhookUrl = 'https://app.mahoorrlste.ir/api/telegram/webhook';

  const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
  });
  const setJson = await setRes.json();

  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const infoJson = await infoRes.json();

  return NextResponse.json({ setWebhook: setJson, getWebhookInfo: infoJson });
}
