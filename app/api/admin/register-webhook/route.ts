import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// bot=telegram (default) → the real-estate @mahoorads_bot, unchanged behavior.
// bot=gbot → the separate personal Gemini assistant bot (GBOT_TOKEN), isolated route.
const BOT_CONFIG: Record<string, { tokenEnv: string; webhookPath: string; allowedUpdates: string[] }> = {
  telegram: { tokenEnv: 'TELEGRAM_BOT_TOKEN', webhookPath: '/api/telegram/webhook', allowedUpdates: ['message', 'callback_query'] },
  gbot:     { tokenEnv: 'GBOT_TOKEN',         webhookPath: '/api/gbot/webhook',     allowedUpdates: ['message'] },
};

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.WEBHOOK_SETUP_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const botParam = req.nextUrl.searchParams.get('bot') || 'telegram';
  const cfg = BOT_CONFIG[botParam];
  if (!cfg) return NextResponse.json({ error: `unknown bot "${botParam}"` }, { status: 400 });

  const token = process.env[cfg.tokenEnv];
  if (!token) return NextResponse.json({ error: `${cfg.tokenEnv} not set` }, { status: 500 });

  const webhookUrl = `https://app.mahoorrlste.ir${cfg.webhookPath}`;

  // Reuse WEBHOOK_SETUP_SECRET as Telegram's secret_token too: Telegram echoes
  // it back on every webhook POST as X-Telegram-Bot-Api-Secret-Token, and the
  // route handlers reject anything that doesn't match — closes the "anyone who
  // guesses the URL can spoof updates" gap without a new env var to configure.
  const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: cfg.allowedUpdates,
      secret_token: process.env.WEBHOOK_SETUP_SECRET,
    }),
  });
  const setJson = await setRes.json();

  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const infoJson = await infoRes.json();

  return NextResponse.json({ bot: botParam, webhookUrl, setWebhook: setJson, getWebhookInfo: infoJson });
}
