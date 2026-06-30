"use client";
import { useState } from "react";

const DEALS = ["فروش", "اجاره", "رهن کامل", "رهن و اجاره", "پیش‌فروش", "اجاره شبانه"];
const PROPS = ["آپارتمان", "ویلا", "زمین", "تجاری"];

type State = "idle" | "loading" | "done" | "error";

export default function PublicSubmit() {
  const [form, setForm] = useState({
    deal: "فروش", propType: "آپارتمان",
    title: "", price: "", location: "", size: "", buildingArea: "", beds: "", phone: "", desc: "",
  });
  const [state, setState] = useState<State>("idle");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.phone.trim()) return;
    setState("loading");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, deal: form.deal, propType: form.propType,
          price: form.price, location: form.location,
          size: form.size, buildingArea: form.buildingArea, beds: form.beds,
          phone: form.phone, advisorPhone: form.phone,
          desc: form.desc, source: "web",
        }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  const inp = "w-full bg-[#030D1E] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-[#d0d8e4] focus:outline-none focus:border-[#D4AF37] font-[Vazirmatn,sans-serif] text-sm";

  if (state === "done") return (
    <div className="min-h-screen bg-[#030D1E] flex items-center justify-center p-6" dir="rtl">
      <div className="bg-[#0C2C54] border border-[#D4AF37]/20 rounded-2xl p-10 text-center max-w-md w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-white text-xl font-bold mb-2">آگهی شما ثبت شد!</h2>
        <p className="text-[#a0b0c0] text-sm">پس از بررسی و تأیید مدیر، آگهی شما منتشر خواهد شد.</p>
        <button onClick={() => { setState("idle"); setForm(f => ({ ...f, title:"",price:"",location:"",size:"",buildingArea:"",beds:"",phone:"",desc:"" })); }}
          className="mt-6 bg-[#D4AF37] text-[#030D1E] font-bold px-8 py-3 rounded-xl hover:bg-[#c9a020] transition">
          ثبت آگهی جدید
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030D1E] p-6" dir="rtl">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-3xl">🏠</span>
            <h1 className="text-white text-2xl font-extrabold mt-1">ثبت آگهی ملکی</h1>
            <p className="text-[#D4AF37] text-sm">املاک ماهور — محمودآباد</p>
          </a>
        </div>

        <form onSubmit={submit} className="bg-[#0C2C54] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-sm font-semibold mb-1">نوع معامله</label>
              <select value={form.deal} onChange={set("deal")} className={inp}>
                {DEALS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-semibold mb-1">نوع ملک</label>
              <select value={form.propType} onChange={set("propType")} className={inp}>
                {PROPS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-1">عنوان آگهی <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={set("title")} placeholder="مثال: آپارتمان ۱۲۰ متری نوساز - ۳ خواب" className={inp} required />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-1">قیمت</label>
            <input value={form.price} onChange={set("price")} placeholder="مثال: ۲.۵ میلیارد تومان" className={inp} />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-1">محل ملک</label>
            <input value={form.location} onChange={set("location")} placeholder="مثال: محمودآباد، خیابان امام" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-sm font-semibold mb-1">متراژ (متر)</label>
              <input type="number" value={form.size} onChange={set("size")} placeholder="۱۲۰" className={inp} />
            </div>
            <div>
              <label className="block text-white text-sm font-semibold mb-1">متراژ بنا (متر)</label>
              <input type="number" value={form.buildingArea} onChange={set("buildingArea")} placeholder="۹۰" className={inp} />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-1">تعداد خواب</label>
            <input type="number" value={form.beds} onChange={set("beds")} placeholder="۳" className={inp} />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-1">شماره تماس <span className="text-red-400">*</span></label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="۰۹۱۱..." dir="ltr" className={inp} required />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-1">توضیحات (اختیاری)</label>
            <textarea value={form.desc} onChange={set("desc")} rows={3} placeholder="توضیحات بیشتر..."
              className={inp + " resize-none"} />
          </div>

          {state === "error" && (
            <p className="text-red-400 text-sm text-center">خطا در ثبت آگهی. لطفاً دوباره تلاش کنید.</p>
          )}

          <button type="submit" disabled={state === "loading"}
            className="w-full bg-[#D4AF37] text-[#030D1E] font-bold py-3 rounded-xl hover:bg-[#c9a020] disabled:opacity-60 transition text-base">
            {state === "loading" ? "در حال ثبت..." : "⬅ ثبت آگهی"}
          </button>

          <p className="text-[#a0b0c0] text-xs text-center">
            آگهی شما پس از تأیید مدیر منتشر می‌شود.
            <br />اطلاعات تماس شما نزد ما محرمانه باقی می‌ماند.
          </p>
        </form>

        <p className="text-center text-[#a0b0c0] text-xs mt-4">
          <a href="https://mahoorrlste.ir" className="hover:text-[#D4AF37] transition">← بازگشت به سایت اصلی</a>
        </p>
      </div>
    </div>
  );
}
