import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ text: "خطا: کلید API مفقود است." }, { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Simulate real-estate specialized context:
    const systemPrompt = `شما یک دستیار هوشمند و فوق‌العاده حرفه‌ای در حوزه املاک لوکس در منطقه شمال ایران (به ویژه محمودآباد) هستید. نام شما "دستیار ماهور" است. مودب، مختصر و مفید پاسخ دهید.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [systemPrompt, prompt],
    });
    
    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ text: "ببخشید، خطایی در ارتباط با هوش مصنوعی رخ داد." }, { status: 500 });
  }
}
