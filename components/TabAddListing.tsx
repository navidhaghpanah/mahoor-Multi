"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Building2, TreePine, Store, Send, MessageCircle,
  CheckCircle2, ChevronDown, Info
} from "lucide-react";

const DEAL_TYPES = ["فروش", "اجاره", "رهن کامل", "رهن و اجاره", "پیش‌فروش"];
const PROP_TYPES = [
  { label: "آپارتمان", Icon: Building2 },
  { label: "ویلا", Icon: Home },
  { label: "زمین", Icon: TreePine },
  { label: "تجاری / اداری", Icon: Store },
];

const CHANNELS = [
  { id: "whatsapp", label: "واتساپ", color: "#25D366", bg: "bg-[#25D366]/10 border-[#25D366]/30" },
  { id: "divar", label: "دیوار", color: "#d42b2b", bg: "bg-red-500/10 border-red-500/30" },
  { id: "sheypoor", label: "شیپور", color: "#f97316", bg: "bg-orange-500/10 border-orange-500/30" },
  { id: "telegram", label: "تلگرام", color: "#229ED9", bg: "bg-blue-400/10 border-blue-400/30" },
];

export function TabAddListing() {
  const [deal, setDeal] = useState("فروش");
  const [propType, setPropType] = useState("آپارتمان");
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [phone, setPhone] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["whatsapp"]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleChannel = (id: string) =>
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !phone) return;
    setLoading(true);

    const msg =
      `🏠 *آگهی جدید - املاک ماهور*\n\n` +
      `📋 عنوان: ${title}\n` +
      `🔑 نوع معامله: ${deal}\n` +
      `🏗 نوع ملک: ${propType}\n` +
      (size ? `📐 متراژ: ${size} متر\n` : "") +
      (beds ? `🛏 اتاق خواب: ${beds}\n` : "") +
      (price ? `💰 قیمت: ${price} تومان\n` : "") +
      (location ? `📍 موقعیت: ${location}\n` : "") +
      `📞 تماس: ${phone}\n` +
      (desc ? `📝 توضیحات: ${desc}` : "");

    await new Promise((r) => setTimeout(r, 800));

    if (selectedChannels.includes("whatsapp")) {
      window.open(
        "https://wa.me/989111134767?text=" + encodeURIComponent(msg),
        "_blank"
      );
    }
    if (selectedChannels.includes("telegram")) {
      window.open(
        "https://t.me/mahoorrlste?text=" + encodeURIComponent(msg),
        "_blank"
      );
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle(""); setSize(""); setPrice(""); setBeds(""); setPhone(""); setDesc(""); setLocation("");
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">ثبت آگهی ملکی</h1>
        <p className="text-[#a0b0c0] text-sm">آگهی خود را ثبت کنید و به درگاه‌های مختلف ارسال نمایید</p>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">آگهی ثبت شد!</h2>
            <p className="text-[#a0b0c0] text-center text-sm">آگهی شما با موفقیت به درگاه‌های انتخابی ارسال شد.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Deal Type */}
            <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-5">
              <label className="block text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">نوع معامله</label>
              <div className="flex flex-wrap gap-2">
                {DEAL_TYPES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDeal(d)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      deal === d
                        ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        : "bg-[#1E293B] text-gray-300 hover:bg-[#1E293B]/80"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type */}
            <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-5">
              <label className="block text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">نوع ملک</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROP_TYPES.map(({ label, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPropType(label)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      propType === label
                        ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-[#1E293B]/50 border-[#1E293B] text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Details */}
            <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
              <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">اطلاعات ملک</label>

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">عنوان آگهی *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: آپارتمان ۱۲۰ متری نوساز، ۳ خواب"
                  required
                  className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 font-medium mb-2">متراژ (متر)</label>
                  <input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="۱۲۰"
                    className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 font-medium mb-2">اتاق خواب</label>
                  <input
                    type="number"
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    placeholder="۳"
                    className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">قیمت (تومان)</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="۲,۵۰۰,۰۰۰,۰۰۰"
                  className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">موقعیت</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="محمودآباد، خیابان امام..."
                  className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">شماره تماس *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۱..."
                  required
                  dir="ltr"
                  className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="ویژگی‌های ملک، امکانات، شرایط معامله..."
                  className="w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600 resize-none"
                />
              </div>
            </div>

            {/* Channels */}
            <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">ارسال به درگاه‌ها</label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="hidden group-hover:block absolute bottom-6 right-0 bg-[#030D1E] border border-[#1E293B] rounded-xl p-3 text-xs text-gray-400 w-52 z-10 shadow-xl">
                    آگهی شما به درگاه‌های انتخابی ارسال می‌شود
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedChannels.includes(ch.id)
                        ? ch.bg + " border-opacity-60"
                        : "bg-[#1E293B]/50 border-[#1E293B] hover:border-gray-600"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: ch.color + "33" }}
                    >
                      <span style={{ color: ch.color }}>{ch.label[0]}</span>
                    </div>
                    <span className={`text-sm font-medium ${selectedChannels.includes(ch.id) ? "text-white" : "text-gray-400"}`}>
                      {ch.label}
                    </span>
                    {selectedChannels.includes(ch.id) && (
                      <CheckCircle2 className="w-4 h-4 mr-auto" style={{ color: ch.color }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !title || !phone || selectedChannels.length === 0}
              className="w-full bg-[#D4AF37] hover:bg-[#B8962E] disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ثبت و ارسال آگهی
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
