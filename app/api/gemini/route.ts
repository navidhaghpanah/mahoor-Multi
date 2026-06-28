import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `شما یک دستیار هوشمند و فوق‌العاده حرفه‌ای در حوزه املاک لوکس در منطقه شمال ایران (به ویژه محمودآباد) هستید. نام شما "دستیار ماهور" است. مودب، مختصر و مفید پاسخ دهید.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ text: "لطفا سوال خود را وارد کنید." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { text: "سرویس هوش مصنوعی پیکربندی نشده است. لطفا با پشتیبانی تماس بگیرید." },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // contents must be a string/Part/Content — not an array of plain strings.
    // The system prompt belongs in config.systemInstruction.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text ?? "پاسخی دریافت نشد. لطفا دوباره تلاش کنید.";
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API error:", error?.message ?? error);
    return NextResponse.json(
      { text: "ببخشید، خطایی در ارتباط با هوش مصنوعی رخ داد. لطفا دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
