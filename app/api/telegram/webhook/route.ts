import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate } from '../../../../lib/bot-flow';

export const dynamic = 'force-dynamic';

const api = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function send(chatId: number, text: string, keyboard?: any[][]) {
  const body: any = { chat_id: chatId, text };
  if (keyboard?.length) body.reply_markup = { inline_keyboard: keyboard };
  await fetch(`${api()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    // Reject spoofed updates — only Telegram, calling with the secret_token
    // this webhook was registered with, gets through.
    const expectedSecret = process.env.WEBHOOK_SETUP_SECRET;
    if (expectedSecret) {
      const gotSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (gotSecret !== expectedSecret) {
        return NextResponse.json({ ok: true });
      }
    }

    const update = await req.json();

    let chatId: number | null = null;
    let text: string | null = null;
    let callbackData: string | null = null;
    let photoFileId: string | null = null;

    if (update.message) {
      chatId = update.message.chat?.id ?? null;
      text   = update.message.text ?? null;
      if (update.message.photo?.length) {
        photoFileId = update.message.photo[update.message.photo.length - 1].file_id;
      }
    } else if (update.callback_query) {
      chatId       = update.callback_query.message?.chat?.id ?? null;
      callbackData = update.callback_query.data ?? null;
      fetch(`${api()}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      }).catch(() => {});
    }

    if (chatId) {
      const msgs = await handleUpdate('telegram', chatId, text, callbackData, photoFileId);
      for (const m of msgs) await send(chatId, m.text, m.keyboard);
    }
  } catch (e: any) {
    console.error('[telegram/webhook]', e?.message);
  }
  return NextResponse.json({ ok: true }); // always 200 to Telegram
}
