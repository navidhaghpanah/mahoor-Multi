import { db } from '../src/db/index';
import { telegramSessions, realEstateAds, users } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { publishApprovedListing } from './publish';
import { listingCode, formatPrice, formatNumber, toPersianDigits } from './format';

async function downloadPhoto(bot: string, fileId: string): Promise<string | null> {
  const token = bot === 'bale'
    ? process.env.BALE_BOT_TOKEN
    : process.env.TELEGRAM_BOT_TOKEN;
  const apiBase = bot === 'bale'
    ? `https://tapi.bale.ai/bot${token}`
    : `https://api.telegram.org/bot${token}`;
  if (!token) return null;
  try {
    const meta = await fetch(`${apiBase}/getFile?file_id=${fileId}`).then(r => r.json());
    if (!meta.ok) return null;
    const filePath: string = meta.result.file_path;
    const fileBase = bot === 'bale'
      ? `https://tapi.bale.ai/file/bot${token}`
      : `https://api.telegram.org/file/bot${token}`;
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

const MASK_PHONES = ['09120996426', '09120997453'];
const MAX_BOT_PHOTOS = 6;

type Step =
  | 'idle' | 'deal_type' | 'prop_type' | 'title' | 'price' | 'location'
  | 'area' | 'building_area' | 'rooms' | 'phone' | 'photo'
  | 'myads_phone' | 'myads_pick' | 'myads_field' | 'myads_value';
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

async function createListing(data: Data, bot: string): Promise<{ id: number; approved: boolean; code: string }> {
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

  // Advisor (insider) submissions auto-publish; public submissions stay pending.
  const submitterPhone = data.phone ?? null;
  const submitterUser = submitterPhone
    ? await db.select({ id: users.id }).from(users).where(eq(users.phoneNumber, submitterPhone))
    : [];
  const isAdvisor = submitterUser.length > 0;

  const images: string[] = data.images ? JSON.parse(data.images) : [];

  const inserted = await db.insert(realEstateAds).values({
    title:         data.title        ?? 'بدون عنوان',
    description:   `نوع ملک: ${data.propType || '—'}`,
    price:         parseInt((data.price ?? '').replace(/[^0-9]/g, ''), 10) || 0,
    type:          data.dealType     ?? 'نامشخص',
    location:      data.location     ?? '',
    areaSize:      parseInt(data.area  ?? '0', 10) || 0,
    buildingArea:  parseInt(data.buildingArea ?? '0', 10) || null,
    rooms:         parseInt(data.rooms ?? '0', 10) || 0,
    imageUrl:      images[0] ?? null,
    images:        images.length > 0 ? JSON.stringify(images) : null,
    submitterPhone,
    publishStatus: 'pending',
    advisorId,
    isManagerApproved: isAdvisor,
    source: bot,
  }).returning({ id: realEstateAds.id });

  const newId = inserted[0].id;
  if (isAdvisor) void publishApprovedListing(newId);

  return { id: newId, approved: isAdvisor, code: listingCode(newId) };
}

function buildSummary(data: Data, result: { approved: boolean; code: string }): string {
  const status = result.approved
    ? '✅ آگهی شما ثبت و منتشر شد!'
    : '✅ آگهی شما ثبت شد و در صف بررسی مدیر است.';

  const detailLines = [
    `🔖 کد آگهی: ${result.code}`,
    `🏷 نوع: ${data.dealType} — ${data.propType}`,
    `📝 عنوان: ${data.title}`,
    `💰 قیمت: ${formatPrice(data.price)}`,
    `📍 محل: ${data.location}`,
    `📐 متراژ: ${formatNumber(data.area)} متر`,
    (parseInt(data.buildingArea ?? '0', 10) > 0) ? `🏗 متراژ بنا: ${formatNumber(data.buildingArea)} متر` : '',
    `🛏 خواب: ${toPersianDigits(data.rooms ?? '0')}`,
    `📞 تماس: ${toPersianDigits(data.phone ?? '')}`,
  ].filter(Boolean).join('\n');

  const footer = result.approved ? '' : '\n\n⏳ پس از تأیید مدیر منتشر می‌شود.';

  return `${status}\n\n📋 خلاصه:\n${detailLines}${footer}`;
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
const photoMoreKeyboard: Key[][] = [[{ text: '✅ پایان و ثبت آگهی', callback_data: 'finish_photos' }]];
const newListing: Key[][] = [
  [{ text: '➕ ثبت آگهی جدید', callback_data: 'new_listing' }],
  [{ text: '📋 آگهی‌های من', callback_data: 'my_ads' }],
];
const editFieldKeyboard: Key[][] = [
  [{ text: '📝 عنوان', callback_data: 'editfield:title' }, { text: '💰 قیمت', callback_data: 'editfield:price' }],
  [{ text: '📍 محل', callback_data: 'editfield:location' }, { text: '📐 متراژ', callback_data: 'editfield:area' }],
  [{ text: '🏗 متراژ بنا', callback_data: 'editfield:buildingArea' }, { text: '🛏 خواب', callback_data: 'editfield:rooms' }],
  [{ text: '📞 شماره تماس', callback_data: 'editfield:phone' }],
];

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
    const isMyAds = !!(text === '/myads' || (text && /آگهی.*من/.test(text)) || callbackData === 'my_ads');

    if (isMyAds) {
      await saveSession(chatId, bot, 'myads_phone', {});
      return [{ text: '📱 شماره موبایلی که آگهی(های) خود را با آن ثبت کرده‌اید وارد کنید:' }];
    }

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
      await saveSession(chatId, bot, 'building_area', data);
      return [{ text: '🏗 متراژ بنا را وارد کنید (متر مربع)\nاگر ندارید عدد ۰ را بفرستید:' }];
    }

    if (step === 'building_area') {
      if (!text?.trim()) return [{ text: 'لطفاً متراژ بنا را وارد کنید یا عدد ۰ را بفرستید.' }];
      data.buildingArea = text.trim();
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
      return [{ text: '🖼 عکس(های) ملک را ارسال کنید (اختیاری، تا ۶ عکس)\nیا دکمه رد کردن را بزنید:', keyboard: skipPhoto }];
    }

    if (step === 'photo') {
      let imgs: string[] = data.images ? JSON.parse(data.images) : [];

      if (photoFileId) {
        const dataUrl = await downloadPhoto(bot, photoFileId);
        if (dataUrl) imgs.push(dataUrl);
        data.images = JSON.stringify(imgs);
        await saveSession(chatId, bot, 'photo', data);
        if (imgs.length < MAX_BOT_PHOTOS) {
          return [{
            text: `🖼 عکس ${toPersianDigits(imgs.length)} ذخیره شد.\nعکس بعدی را بفرستید یا «پایان» را بزنید:`,
            keyboard: photoMoreKeyboard,
          }];
        }
        // hit the cap — fall through and finalize automatically
      }

      const wantsFinish =
        callbackData === 'finish_photos' ||
        callbackData === 'skip_photo' ||
        imgs.length >= MAX_BOT_PHOTOS ||
        (!!text && !photoFileId);

      if (wantsFinish) {
        try {
          const result = await createListing(data, bot);
          await saveSession(chatId, bot, 'idle', {});
          return [{ text: buildSummary(data, result), keyboard: newListing }];
        } catch (e: any) {
          await saveSession(chatId, bot, 'idle', {});
          console.error('[bot-flow] createListing failed:', e?.message);
          return [{ text: '❌ خطا در ثبت آگهی. لطفاً دوباره تلاش کنید یا با دفتر تماس بگیرید: ۰۱۱-۴۴۷۳-۵۳۳۳' }];
        }
      }

      return [{
        text: imgs.length ? 'عکس دیگری بفرستید یا «پایان» را بزنید.' : 'عکس ارسال کنید یا دکمه «رد کردن» را بزنید.',
        keyboard: imgs.length ? photoMoreKeyboard : skipPhoto,
      }];
    }

    // ── Edit own listing via bot ────────────────────────────────────────────────
    if (step === 'myads_phone') {
      const phone = text?.trim();
      if (!phone) return [{ text: 'لطفاً شماره موبایل را وارد کنید.' }];
      const ads = await db.select().from(realEstateAds)
        .where(eq(realEstateAds.submitterPhone, phone))
        .orderBy(desc(realEstateAds.timestamp)).limit(10);
      if (!ads.length) {
        await saveSession(chatId, bot, 'idle', {});
        return [{ text: 'آگهی‌ای با این شماره یافت نشد.', keyboard: newListing }];
      }
      const pickKeyboard: Key[][] = ads.map(a => [{
        text: `${listingCode(a.id)} — ${a.title.slice(0, 30)}`,
        callback_data: `editpick:${a.id}`,
      }]);
      await saveSession(chatId, bot, 'myads_pick', { phone });
      return [{ text: `📋 ${toPersianDigits(ads.length)} آگهی یافت شد. یکی را برای ویرایش انتخاب کنید:`, keyboard: pickKeyboard }];
    }

    if (step === 'myads_pick') {
      if (!callbackData?.startsWith('editpick:')) return [{ text: 'لطفاً یکی از آگهی‌های بالا را انتخاب کنید.' }];
      const id = callbackData.slice(9);
      const rows = await db.select().from(realEstateAds).where(eq(realEstateAds.id, Number(id)));
      if (!rows.length || rows[0].submitterPhone !== data.phone) {
        return [{ text: '⛔ دسترسی به ویرایش این آگهی مجاز نیست.' }];
      }
      await saveSession(chatId, bot, 'myads_field', { phone: data.phone, editId: id });
      return [{ text: 'کدام بخش را می‌خواهید ویرایش کنید؟', keyboard: editFieldKeyboard }];
    }

    if (step === 'myads_field') {
      if (!callbackData?.startsWith('editfield:')) return [{ text: 'لطفاً یکی از گزینه‌های بالا را انتخاب کنید.', keyboard: editFieldKeyboard }];
      const field = callbackData.slice(10);
      await saveSession(chatId, bot, 'myads_value', { ...data, editField: field });
      const prompts: Record<string, string> = {
        title:        '📝 عنوان جدید را بنویسید:',
        price:        '💰 قیمت جدید را بنویسید:',
        location:     '📍 محل جدید را بنویسید:',
        area:         '📐 متراژ جدید را وارد کنید:',
        buildingArea: '🏗 متراژ بنا جدید را وارد کنید:',
        rooms:        '🛏 تعداد خواب جدید را وارد کنید:',
        phone:        '📞 شماره تماس جدید را وارد کنید:',
      };
      return [{ text: prompts[field] ?? 'مقدار جدید را وارد کنید:' }];
    }

    if (step === 'myads_value') {
      if (!text?.trim()) return [{ text: 'لطفاً مقدار جدید را وارد کنید.' }];
      const field = data.editField;
      const id = Number(data.editId);
      const updates: Record<string, any> = {};
      if (field === 'title') updates.title = text.trim();
      else if (field === 'price') updates.price = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
      else if (field === 'location') updates.location = text.trim();
      else if (field === 'area') updates.areaSize = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
      else if (field === 'buildingArea') updates.buildingArea = parseInt(text.replace(/[^0-9]/g, ''), 10) || null;
      else if (field === 'rooms') updates.rooms = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
      else if (field === 'phone') updates.submitterPhone = text.trim();

      if (Object.keys(updates).length > 0) {
        await db.update(realEstateAds).set(updates).where(eq(realEstateAds.id, id));
      }
      await saveSession(chatId, bot, 'idle', {});
      return [{ text: '✅ آگهی بروزرسانی شد.', keyboard: newListing }];
    }

    // Fallback / idle
    return [{ text: 'برای ثبت آگهی ملکی «ثبت آگهی» بنویسید یا /start بزنید.\nبرای ویرایش آگهی‌های قبلی «آگهی‌های من» بنویسید.', keyboard: newListing }];
  } catch (e: any) {
    console.error('[bot-flow]', e?.message);
    return [{ text: '⚠️ خطای سیستم. لطفاً کمی بعد دوباره تلاش کنید.' }];
  }
}
