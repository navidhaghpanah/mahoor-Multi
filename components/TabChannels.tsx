"use client";

import { motion } from "motion/react";
import { ExternalLink, Copy, CheckCheck, Phone, MapPin, Clock, Search } from "lucide-react";
import { useState } from "react";

// Google-search-only lookup — no scraping. We never fetch or display Divar/Sheypoor
// content ourselves; the click just opens Google's own results page in a new tab.
function buildDivarSheypoorSearchUrl(query: string): string {
  const q = `${query} site:divar.ir OR site:sheypoor.com`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

const CHANNELS = [
  {
    id: "instagram",
    name: "اینستاگرام",
    handle: "@amlake_mahour",
    url: "https://www.instagram.com/amlake_mahour/",
    color: "#E1306C",
    gradient: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
    desc: "آگهی‌های تصویری، ریلز و استوری",
    followers: "۲.۴ هزار",
  },
  {
    id: "telegram",
    name: "تلگرام",
    handle: "@mahoorrlste",
    url: "https://t.me/mahoorrlste",
    color: "#229ED9",
    gradient: "from-[#229ED9] to-[#1a7fb8]",
    desc: "کانال آگهی‌ها و اخبار ملکی",
    followers: "۱.۱ هزار",
  },
  {
    id: "whatsapp",
    name: "واتساپ",
    handle: "۰۹۱۱۱۱۳۴۷۶۷",
    url: "https://wa.me/989111134767",
    color: "#25D366",
    gradient: "from-[#25D366] to-[#128C7E]",
    desc: "مشاوره و ارسال آگهی مستقیم",
    followers: null,
  },
  {
    id: "rubika",
    name: "روبیکا",
    handle: "@mahoorrlste",
    url: "https://rubika.ir/mahoorrlste",
    color: "#8B5CF6",
    gradient: "from-[#8B5CF6] to-[#6D28D9]",
    desc: "کانال اختصاصی در پیام‌رسان روبیکا",
    followers: "۵۸۰",
  },
  {
    id: "bale",
    name: "بله",
    handle: "@mahoorrlste",
    url: "https://ble.ir/mahoorrlste",
    color: "#0088CC",
    gradient: "from-[#0088CC] to-[#005f8e]",
    desc: "کانال آگهی‌ها در بله",
    followers: "۳۴۰",
  },
  {
    id: "eitaa",
    name: "ایتا",
    handle: "@mahoorrlste",
    url: "https://eitaa.com/mahoorrlste",
    color: "#00A86B",
    gradient: "from-[#00A86B] to-[#007048]",
    desc: "کانال پیام‌رسان ایتا",
    followers: "۲۲۰",
  },
];

const AGENTS = [
  { name: "کارشناس عزیزپور", role: "کارشناس ارشد ملکی", phone: "09111134767", deals: "۳۰۰+", years: "۱۰+", rating: "۴.۹" },
  { name: "مهندس آزاد", role: "مهندس عمران و کارشناس", phone: "09113276667", deals: "۵۰+", years: "۸+", rating: "۴.۸" },
  { name: "کارشناس رضایی", role: "کارشناس اجاره و رهن", phone: "09195183950", deals: "۲۰۰+", years: "۷+", rating: "۴.۷" },
];

export function TabChannels() {
  const [copied, setCopied] = useState<string | null>(null);
  const [rivalQuery, setRivalQuery] = useState("ویلا محمودآباد");

  const openRivalSearch = () => {
    if (!rivalQuery.trim()) return;
    window.open(buildDivarSheypoorSearchUrl(rivalQuery.trim()), "_blank", "noopener");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">درگاه‌ها و ارتباطات</h1>
        <p className="text-[#a0b0c0] text-sm">کانال‌های رسمی و ارتباط مستقیم با کارشناسان ماهور</p>
      </div>

      {/* Office Info */}
      <div className="bg-gradient-to-br from-[#0C2C54] to-[#030D1E] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
        <h2 className="font-bold text-[#D4AF37] mb-4 text-lg">اطلاعات دفتر</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">آدرس</p>
              <p className="text-sm text-white leading-relaxed">محمودآباد، خیابان امام، بعد از نسیم ۶۹/۱</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">ساعت کاری</p>
              <p className="text-sm text-white">۸ صبح تا ۸ شب</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">تلفن دفتر</p>
              <a href="tel:09111134767" className="text-sm text-[#D4AF37] font-bold" dir="ltr">۰۹۱۱۱-۱۳۴۷۶۷</a>
            </div>
          </div>
        </div>

        <a
          href="https://maps.app.goo.gl/Dv4UxLHXSBrPe1xbA"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm bg-[#1E293B] hover:bg-[#D4AF37]/10 border border-[#1E293B] hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] px-4 py-2 rounded-xl transition-all"
        >
          <MapPin className="w-4 h-4" />
          مسیریابی در گوگل مپ
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Divar/Sheypoor rival search — Google results only, no scraping */}
      <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-6">
        <h2 className="font-bold text-white mb-1 text-lg flex items-center gap-2">
          <Search className="w-5 h-5 text-[#D4AF37]" />
          جستجوی آگهی‌های مشابه در دیوار و شیپور
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          نتایج گوگل برای مقایسه با آگهی‌های دیوار و شیپور را در تب جدید باز می‌کند —
          داده‌ای از این سایت‌ها داخل اپ نمایش داده نمی‌شود.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={rivalQuery}
            onChange={(e) => setRivalQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openRivalSearch()}
            placeholder="مثال: آپارتمان ۲ خواب محمودآباد"
            className="flex-1 bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-500"
          />
          <button
            onClick={openRivalSearch}
            className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold px-5 py-3 rounded-xl text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            جستجو در گوگل
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Social Channels Grid */}
      <div>
        <h2 className="font-bold text-white mb-4 text-lg">شبکه‌های اجتماعی</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHANNELS.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#0C2C54]/40 border border-[#1E293B] hover:border-[#D4AF37]/20 rounded-2xl overflow-hidden transition-all group"
            >
              <div className={`h-1.5 bg-gradient-to-r ${ch.gradient}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: ch.color + "22", border: `1px solid ${ch.color}44` }}
                    >
                      <span style={{ color: ch.color }}>{ch.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{ch.name}</h3>
                      {ch.followers && (
                        <p className="text-xs text-gray-400">{ch.followers} عضو</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#D4AF37]/10 flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-xs text-gray-400 mb-3">{ch.desc}</p>

                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs font-mono bg-[#030D1E] border border-[#1E293B] rounded-lg px-3 py-2 text-gray-300 overflow-hidden text-ellipsis"
                    dir="ltr"
                  >
                    {ch.handle}
                  </code>
                  <button
                    onClick={() => copyToClipboard(ch.handle, ch.id)}
                    className="w-8 h-8 rounded-lg bg-[#1E293B] hover:bg-[#D4AF37]/10 flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-all flex-shrink-0"
                  >
                    {copied === ch.id
                      ? <CheckCheck className="w-4 h-4 text-green-400" />
                      : <Copy className="w-4 h-4" />
                    }
                  </button>
                </div>

                <a
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border"
                  style={{
                    color: ch.color,
                    borderColor: ch.color + "44",
                    backgroundColor: ch.color + "11",
                  }}
                >
                  دنبال کردن / اشتراک
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div>
        <h2 className="font-bold text-white mb-4 text-lg">کارشناسان ما</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AGENTS.map((ag, i) => (
            <motion.div
              key={ag.phone}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-[#0C2C54]/40 border border-[#1E293B] hover:border-[#D4AF37]/30 rounded-2xl p-5 text-center transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a3c6e] to-[#0C2C54] border-2 border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-[#D4AF37]">
                {ag.name.split(" ").pop()?.[0]}
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{ag.name}</h3>
              <p className="text-[#D4AF37] text-xs mb-3">{ag.role}</p>

              <div className="flex justify-around py-3 border-y border-[#1E293B] mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{ag.deals}</p>
                  <p className="text-gray-500 text-[10px]">معامله</p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{ag.years}</p>
                  <p className="text-gray-500 text-[10px]">سال سابقه</p>
                </div>
                <div>
                  <p className="text-[#D4AF37] font-bold text-sm">⭐ {ag.rating}</p>
                  <p className="text-gray-500 text-[10px]">امتیاز</p>
                </div>
              </div>

              <a
                href={`tel:${ag.phone}`}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a3c6e] to-[#0C2C54] hover:from-[#D4AF37]/20 hover:to-[#D4AF37]/10 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                تماس
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
