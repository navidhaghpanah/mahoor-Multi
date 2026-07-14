// Personal Telegram AI chatbot — Gemini + always-on Google Search grounding.
// COMPLETELY ISOLATED from the real-estate app: separate bot token (GBOT_TOKEN),
// no DB access, no shared session store, no shared handler with
// app/api/telegram/webhook/route.ts (that one stays untouched).
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { rateLimit } from '../../../../lib/rate-limit';

export const dynamic = 'force-dynamic';

const api = () => `https://api.telegram.org/bot${process.env.GBOT_TOKEN}`;

const WELCOME = 'سلام! من دستیار هوشمند ماهور هستم، هر چی بخوای بپرس 🌐 (با جست‌وجوی زنده گوگل)';

// ── Per-chat conversation memory (last ~6 turns) ────────────────────────────
// In-memory only — resets on cold start / redeploy, which is fine for a
// personal assistant bot and keeps this route fully stateless w.r.t. the DB
// (no new tables, no shared storage with the real-estate app).
type Turn = { role: 'user' | 'model'; text: string };
const HISTORY_MAX_TURNS = 6; // 6 user+model pairs kept per chat
const historyByChat = new Map<number, Turn[]>();

function getHistory(chatId: number): Turn[] {
  return historyByChat.get(chatId) ?? [];
}
function pushHistory(chatId: number, userText: string, modelText: string) {
  const h = getHistory(chatId);
  h.push({ role: 'user', text: userText }, { role: 'model', text: modelText });
  while (h.length > HISTORY_MAX_TURNS * 2) h.shift();
  historyByChat.set(chatId, h);
}

// ── Telegram send with 4096-char chunking (plain text, no parse_mode —
// avoids HTML/Markdown entity-escaping edge cases with Gemini's free-form output) ──
const TG_LIMIT = 4096;

function chunkText(text: string, limit = TG_LIMIT): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    // Prefer breaking at the last newline before the limit, else hard-cut
    let cut = rest.lastIndexOf('\n', limit);
    if (cut < limit * 0.5) cut = limit;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n+/, '');
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function sendMessage(chatId: number, text: string) {
  for (const chunk of chunkText(text)) {
    await fetch(`${api()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    }).catch(() => {});
  }
}

// ── Gemini with Google Search grounding always on ──────────────────────────
async function askGemini(chatId: number, userText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'سرویس هوش مصنوعی پیکربندی نشده است (GEMINI_API_KEY تنظیم نشده).';

  const ai = new GoogleGenAI({ apiKey });
  const history = getHistory(chatId);

  const contents = [
    ...history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: 'user' as const, parts: [{ text: userText }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'شما یک دستیار هوشمند شخصی فارسی‌زبان هستید. مودب، دقیق و مختصر پاسخ بده. ' +
          'برای سوالاتی که نیاز به اطلاعات به‌روز دارند از نتایج جست‌وجوی گوگل استفاده کن.',
      },
    });
    const text = response.text?.trim();
    return text || 'پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.';
  } catch (e: any) {
    console.error('[gbot] Gemini error:', e?.message ?? e);
    return 'ببخشید، خطایی در ارتباط با هوش مصنوعی رخ داد. لطفاً دوباره تلاش کنید.';
  }
}

export async function POST(req: NextRequest) {
  try {
    // Reject requests that don't carry the secret_token this webhook was
    // registered with — closes the "anyone who guesses the URL can spoof
    // Telegram updates" gap. Skipped only if WEBHOOK_SETUP_SECRET was never
    // configured (keeps local/dev testing possible without it).
    const expectedSecret = process.env.WEBHOOK_SETUP_SECRET;
    if (expectedSecret) {
      const gotSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (gotSecret !== expectedSecret) {
        return NextResponse.json({ ok: true }); // 200 so Telegram doesn't retry; just drop it
      }
    }

    const update = await req.json();
    const chatId: number | null = update?.message?.chat?.id ?? null;
    const text: string | null = update?.message?.text ?? null;

    if (chatId && text) {
      if (text.trim() === '/start') {
        await sendMessage(chatId, WELCOME);
      } else if (!rateLimit(`gbot:${chatId}`, 15, 60_000)) {
        await sendMessage(chatId, 'کمی آرام‌تر 🙂 چند لحظه صبر کن و دوباره بپرس.');
      } else {
        const answer = await askGemini(chatId, text);
        pushHistory(chatId, text, answer);
        await sendMessage(chatId, answer);
      }
    }
  } catch (e: any) {
    console.error('[gbot/webhook]', e?.message ?? e);
  }
  return NextResponse.json({ ok: true }); // always 200 to Telegram
}
