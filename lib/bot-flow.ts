import { db } from '../src/db/index';
import { telegramSessions, realEstateAds, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const MASK_PHONES = ['09120996426', '09120997453'];

type Step = 'idle' | 'deal_type' | 'prop_type' | 'title' | 'price' | 'location' | 'area' | 'rooms' | 'phone' | 'photo';
type Data = Record<string, string>;
type Key  = { text: string; callback_data: string };
export type BotMsg = { text: string; keyboard?: Key[][] };

async function getSession(chatId: number): Promise<{ step: Step; data: Data }> {
  const rows = await db.select().from(telegramSessions).where(eq(telegramSessions.chatId, chatId));
  if (!rows.length) return { step: 'idle', data: {} };
  return { step: rows[0].step as Step, data: JSON.parse(rows[0].data) };
}

async function saveSession(chatId: number, bot: string, step: Step, data: Data): Promise<void> {
  await db.insert(telegramSessions)
    .values({ chatId, bot, step, data: JSON.stringify(data) })
    .onConflictDoUpdate({
      target: telegramSessions.chatId,
      set: { bot, step, data: JSON.stringify(data) },
    });
}

async function createListing(data: Data, bot: string): Promise<void> {
  const countRows = await db.select({ id: realEstateAds.id })
    .from(realEstateAds).where(eq(realEstateAds.isManagerApproved, false));
  const maskPhone = MASK_PHONES[countRows.length % MASK_PHONES.length];
  const maskRows  = await db.select().from(users).where(eq(users.phoneNumber, maskPhone));

  let advisorId: number;
  if (maskRows.length > 0) {
    advisorId = maskRows[0].id;
  } else {
    const any = await db.select().from(users).limit(1);
    if (!any.length) throw new Error('No users in DB');
    advisorId = any[0].id;
  }

  await db.insert(realEstateAds).values({
    title:         data.title        ?? 'بدون عنوان',
    description:   `نوع ملک: ${data.propType || '—'} | تماس: ${data.phone || '—'} | منبع: ${bot}`,
    price:         parseInt((data.price ?? '').replace(/[^0-9]/g, ''), 10) || 0,
    type:          data.dealType     ?? 'نامشخص',
    location:      data.location     ?? '',
    areaSize:      parseInt(data.area  ?? '0', 10) || 0,
    rooms:         parseInt(data.rooms ?? '0', 10) || 0,
    imageUrl:      data.imageUrl     ?? null,
    submitterPhone: data.phone       ?? null,
    publishStatus: 'pending',
    advisorId,
    isManagerApproved: false,
    source: bot,
  });
}

const dealKeyboard: Key[][] = [
  [{ text: 'فروش',     callback_data: 'deal:فروش'     }, { text: 'اجاره',    callback_data: 'deal:اجاره'    }],
  [{ text: 'رهن کامل', callback_data: 'deal:رهن کامل' }, { text: 'پیش‌فروش', callback_data: 'deal:پیش‌فروش' }],
  [{ text: '🌙 اجاره شبانه', callback_data: 'deal:اجاره شبانه' }],
];
const propKeyboard: Key[][] = [
  [{ text: 'آپارتمان', callback_data: 'prop:آپارتمان' }, { text: 'ویلا',    callback_data: 'prop:ویلا'    }],
  [{ text: 'زمین',     callback_data: 'prop:زمین'     }, { text: 'تجاری',   callback_data: 'prop:تجاری'   }],
];
const roomsKeyboard: Key[][] = [
  [{ text: '۰', callback_data: 'rooms:0' }, { text: '۱', callback_data: 'rooms:1' }, { text: '۲', callback_data: 'rooms:2' }],
  [{ text: '۳', callback_data: 'rooms:3' }, { text: '۴', callback_data: 'rooms:4' }, { text: '۵+', callback_data: 'rooms:5' }],
];
const skipPhoto: Key[][] = [[{ text: '⏭ رد کردن (بدون عکس)', callback_data: 'skip_photo' }]];
const newListing: Key[][] = [[{ text: '➕ ثبت آگهی جدید', callback_data: 'new_listing' }]];

export async function handleUpdate(
  bot: string,
  chatId: number,
  text: string | null,
  callbackData: string | null,
  photoFileId: string | null,
): Promise<BotMsg[]> {
  try {
    const { step, data } = await getSession(chatId);
    const isStart = !!(text === '/start' || /ثبت/.test(text ?? '') || callbackData === 'new_listing');

    if (step === 'idle' || isStart) {
      await saveSession(chatId, bot, 'deal_type', {});
      return [{ text: '🏠 به ربات ثبت آگهی ماهور خوش آمدید!\n\nنوع معامله را انتخاب کنید:', keyboard: dealKeyboard }];
    }

    if (step === 'deal_type') {
      if (!callbackData?.startsWith('deal:')) return [{ text: 'لطفاً یکی از دکمه‌های بالا را انتخاب کنید.', keyboard: dealKeyboard }];
      data.dealType = callbackData.slice(5);
      await saveSession(chatId, bot, 'prop_type', data);
      return [{ text: 'نوع ملک را انتخاب کنید:', keyboard: propKeyboard }];
    }

    if (step === 'prop_type') {
      if (!callbackData?.startsWith('prop:')) return [{ text: 'لطفاً یکی از دکمه‌های بالا را انتخاب کنید.', keyboard: propKeyboard }];
      data.propType = callbackData.slice(5);
      await saveSession(chatId, bot, 'title', data);
      return [{ text: '📝 عنوان آگهی را بنویسید:\n(مثال: آپارتمان ۱۲۰ متری نوساز - ۳ خواب)' }];
    }

    if (step === 'title') {
      if (!text?.trim()) return [{ text: 'لطفاً عنوان آگهی را تایپ کنید.' }];
      data.title = text.trim();
      await saveSession(chatId, bot, 'price', data);
      return [{ text: '💰 قیمت را وارد کنید:\n(مثال: ۲.۵ میلیارد — یا برای اجاره: ۵ میلیون ماهانه)' }];
    }

    if (step === 'price') {
      if (!text?.trim()) return [{ text: 'لطفاً قیمت را وارد کنید.' }];
      data.price = text.trim();
      await saveSession(chatId, bot, 'location', data);
      return [{ text: '📍 محل ملک را بنویسید:\n(مثال: محمودآباد، خیابان امام)' }];
    }

    if (step === 'location') {
      if (!text?.trim()) return [{ text: 'لطفاً محل ملک را بنویسید.' }];
      data.location = text.trim();
      await saveSession(chatId, bot, 'area', data);
      return [{ text: '📐 متراژ را وارد کنید (فقط عدد، به متر):' }];
    }

    if (step === 'area') {
      if (!text?.trim()) return [{ text: 'لطفاً متراژ را وارد کنید.' }];
      data.area = text.trim();
      await saveSession(chatId, bot, 'rooms', data);
      return [{ text: '🛏 تعداد خواب را انتخاب یا تایپ کنید:\n(برای زمین/تجاری: ۰)', keyboard: roomsKeyboard }];
    }

    if (step === 'rooms') {
      const val = callbackData?.startsWith('rooms:') ? callbackData.slice(6) : text?.trim();
      if (!val) return [{ text: 'لطفاً تعداد خواب را انتخاب یا تایپ کنید.', keyboard: roomsKeyboard }];
      data.rooms = val;
      await saveSession(chatId, bot, 'phone', data);
      return [{ text: '📞 شماره تماس خود را وارد کنید:' }];
    }

    if (step === 'phone') {
      if (!text?.trim()) return [{ text: 'لطفاً شماره تماس را وارد کنید.' }];
      data.phone = text.trim();
      await saveSession(chatId, bot, 'photo', data);
      return [{ text: '🖼 عکس ملک را ارسال کنید (اختیاری)\nیا دکمه رد کردن را بزنید:', keyboard: skipPhoto }];
    }

    if (step === 'photo') {
      if (photoFileId) data.imageUrl = `tg://file_id/${photoFileId}`;
      if (photoFileId || callbackData === 'skip_photo' || text) {
        try {
          await createListing(data, bot);
          await saveSession(chatId, bot, 'idle', {});
          return [{
            text: `✅ آگهی شما ثبت شد و در صف بررسی مدیر است.\n\n📋 خلاصه:\n🏷 نوع: ${data.dealType} — ${data.propType}\n📝 عنوان: ${data.title}\n💰 قیمت: ${data.price}\n📍 محل: ${data.location}\n📐 متراژ: ${data.area} متر\n🛏 خواب: ${data.rooms}\n📞 تماس: ${data.phone}\n\n⏳ پس از تأیید مدیر منتشر می‌شود.`,
            keyboard: newListing,
          }];
        } catch (e: any) {
          await saveSession(chatId, bot, 'idle', {});
          console.error('[bot-flow] createListing failed:', e?.message);
          return [{ text: '❌ خطا در ثبت آگهی. لطفاً دوباره تلاش کنید یا با دفتر تماس بگیرید: ۰۱۱-۴۴۷۳-۵۳۳۳' }];
        }
      }
      return [{ text: 'عکس ارسال کنید یا دکمه «رد کردن» را بزنید.', keyboard: skipPhoto }];
    }

    // Fallback / idle
    return [{ text: 'برای ثبت آگهی ملکی «ثبت آگهی» بنویسید یا /start بزنید.', keyboard: newListing }];
  } catch (e: any) {
    console.error('[bot-flow]', e?.message);
    return [{ text: '⚠️ خطای سیستم. لطفاً کمی بعد دوباره تلاش کنید.' }];
  }
}
