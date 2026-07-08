// POST /api/caption → AI-generated publish caption for a listing, per platform.
// Uses the same Gemini key as /api/gemini.
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const PLATFORM_GUIDE: Record<string, string> = {
  divar:
    "پلتفرم: دیوار. بدون ایموجی، بدون لینک، بدون شماره تلفن، بدون هشتگ. متن رسمی و دقیق با ذکر مشخصات. حداکثر ۱۲۰ کلمه.",
  sheypoor:
    "پلتفرم: شیپور. بدون ایموجی، بدون لینک، بدون شماره تلفن، بدون هشتگ. متن رسمی و دقیق با ذکر مشخصات. حداکثر ۱۲۰ کلمه.",
  telegram:
    "پلتفرم: تلگرام. با ایموجی مناسب، ساختار خط‌به‌خط خوانا، در پایان ۳ هشتگ مرتبط. حداکثر ۱۰۰ کلمه.",
  whatsapp:
    "پلتفرم: واتساپ. کوتاه و صمیمی، حداکثر ۴ خط، با ایموجی کم.",
  instagram:
    "پلتفرم: اینستاگرام. کپشن جذاب و فروش‌محور با ایموجی، در پایان یک بلوک ۵ هشتگ مرتبط با املاک شمال. حداکثر ۱۲۰ کلمه.",
};

export async function POST(req: NextRequest) {
  try {
    const { listing, platform } = await req.json();
    if (!listing?.title) {
      return NextResponse.json({ error: "listing required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "سرویس هوش مصنوعی پیکربندی نشده است." },
        { status: 503 }
      );
    }

    const guide = PLATFORM_GUIDE[platform] ?? PLATFORM_GUIDE.telegram;

    const facts = [
      `عنوان: ${listing.title}`,
      listing.price ? `قیمت: ${listing.price}` : "",
      listing.deal ? `نوع معامله: ${listing.deal}` : "",
      listing.location ? `موقعیت: ${listing.location}` : "",
      listing.size ? `متراژ زمین: ${listing.size} متر` : "",
      listing.buildingArea ? `متراژ بنا: ${listing.buildingArea} متر` : "",
      listing.beds ? `تعداد خواب: ${listing.beds}` : "",
      listing.desc ? `توضیحات: ${listing.desc}` : "",
      listing.url ? `لینک صفحه آگهی: ${listing.url}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `مشخصات ملک:\n${facts}\n\n${guide}\n\nفقط متن نهایی کپشن را بنویس، بدون هیچ مقدمه یا توضیح اضافه.`,
      config: {
        systemInstruction:
          "شما کپی‌رایتر حرفه‌ای آگهی املاک برای «مجموعه تخصصی املاک ماهور» در محمودآباد (شمال ایران) هستید. کپشن آگهی فروش/اجاره ملک می‌نویسید: دقیق، بدون اغراق دروغین، فارسی روان. هرگز اطلاعاتی که داده نشده (قیمت، متراژ، امکانات) از خودتان اضافه نکنید.",
      },
    });

    const text = (response.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "پاسخی دریافت نشد." }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("caption API error:", error?.message ?? error);
    return NextResponse.json(
      { error: "خطا در تولید کپشن. دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
