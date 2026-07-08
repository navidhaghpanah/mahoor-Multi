"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { X, Share2, Copy, CheckCircle2, MessageCircle, Send, ExternalLink, QrCode, Download } from "lucide-react";
import type { Listing } from "../lib/listings";
import { formatPrice, formatNumber, toPersianDigits } from "../lib/format";

const DEAL_LABEL: Record<string, string> = {
  sale:     "فروشی",
  rent:     "اجاره‌ای",
  mortgage: "رهن کامل",
  presale:  "پیش‌فروش",
};

const CHANNEL_URL = "https://t.me/mahooradschannel";
const APP_URL     = "https://app.mahoorrlste.ir";

function buildCaption(l: Listing): string {
  const lines = [
    `🏡 ${l.title}`,
    "",
    l.price                        ? `💰 قیمت: ${l.price}`                        : "",
    DEAL_LABEL[l.deal] ?? l.deal   ? `🔑 نوع: ${DEAL_LABEL[l.deal] ?? l.deal}`    : "",
    l.location                     ? `📍 ${l.location}`                            : "",
    l.size                         ? `📐 ${l.size} متر مربع`                       : "",
    l.beds > 0                     ? `🛏 ${l.beds} خواب`                           : "",
    "",
    l.advisorName                  ? `👤 مشاور: ${l.advisorName}`                  : "",
    l.advisorPhone || l.phone      ? `📱 ${l.advisorPhone ?? l.phone}`             : "",
    "",
    "🏠 مجموعه تخصصی املاک ماهور",
    "☎️ 011-4473-5333",
    `📢 ${CHANNEL_URL}`,
  ];
  return lines.filter(Boolean).join("\n");
}

// Builds the canonical public URL from listing.id (numeric string) or listing.code.
function listingPublicUrl(l: Listing): string {
  if (l.id) {
    const n = parseInt(l.id, 10);
    if (n > 0) return `${APP_URL}/p/MH-${String(n).padStart(4, "0")}`;
  }
  if (l.code) {
    // Convert any Persian digits in the display code to ASCII
    const ascii = l.code.replace(/[۰-۹]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x30)
    );
    return `${APP_URL}/p/${ascii}`;
  }
  return APP_URL;
}

type TemplateKey = "divar" | "sheypoor" | "telegram" | "whatsapp" | "instagram";

const TEMPLATE_LABELS: { id: TemplateKey; label: string }[] = [
  { id: "divar",     label: "دیوار" },
  { id: "sheypoor",  label: "شیپور" },
  { id: "telegram",  label: "تلگرام" },
  { id: "whatsapp",  label: "واتساپ" },
  { id: "instagram", label: "اینستاگرام" },
];

function buildTemplates(l: Listing): Record<TemplateKey, string> {
  const url       = listingPublicUrl(l);
  const priceStr  = formatPrice(l.price);
  const dealLabel = DEAL_LABEL[l.deal] ?? l.deal ?? "";

  // Plain spec lines for Divar / Sheypoor (no emojis, no external links)
  const plainSpecLines = [
    l.size > 0                           ? `متراژ زمین: ${formatNumber(l.size)} متر`         : "",
    l.buildingArea && l.buildingArea > 0 ? `متراژ بنا: ${formatNumber(l.buildingArea)} متر`   : "",
    l.beds > 0                           ? `تعداد خواب: ${toPersianDigits(l.beds)}`           : "",
    l.location                           ? `موقعیت: ${l.location}`                            : "",
    dealLabel                            ? `نوع معامله: ${dealLabel}`                         : "",
  ].filter(Boolean);

  // Emoji spec lines for Telegram / Instagram / WhatsApp
  const emojiSpecLines = [
    l.size > 0                           ? `📐 ${formatNumber(l.size)} متر زمین`              : "",
    l.buildingArea && l.buildingArea > 0 ? `🏗 ${formatNumber(l.buildingArea)} متر بنا`       : "",
    l.beds > 0                           ? `🛏 ${toPersianDigits(l.beds)} خواب`               : "",
    l.location                           ? `📍 ${l.location}`                                 : "",
  ].filter(Boolean);

  const plainSpecs = plainSpecLines.join("\n");
  const emojiSpecs = emojiSpecLines.join("\n");

  // دیوار — no emojis, no links, no phone
  const divarLines: string[] = [l.title];
  if (l.desc)     divarLines.push("", l.desc);
  if (plainSpecs) divarLines.push("", plainSpecs);
  divarLines.push("", `قیمت: ${priceStr}`);
  const divar = divarLines.join("\n");

  // شیپور — same format as دیوار
  const sheypoor = divar;

  // تلگرام — emojis + public link + hashtags
  const telegramLines: string[] = [`🏡 ${l.title}`];
  if (emojiSpecs) telegramLines.push("", emojiSpecs);
  telegramLines.push("", `💰 قیمت: ${priceStr}`);
  telegramLines.push("", `🔗 ${url}`);
  telegramLines.push("", "#املاک_ماهور #محمودآباد #شمال_ایران");
  const telegram = telegramLines.join("\n");

  // واتساپ — short: title / price / location / link
  const waLines: string[] = [l.title, `💰 ${priceStr}`];
  if (l.location) waLines.push(`📍 ${l.location}`);
  waLines.push(`🔗 ${url}`);
  const whatsapp = waLines.join("\n");

  // اینستاگرام — full caption with hashtag block
  const igLines: string[] = [`🏠 ${l.title}`];
  if (emojiSpecs) igLines.push("", emojiSpecs);
  igLines.push("", `💰 قیمت: ${priceStr}`);
  igLines.push("", "📍 مجموعه تخصصی املاک ماهور");
  igLines.push(`🔗 ${url}`);
  igLines.push("", "#املاک_ماهور #شمال_ایران #خرید_ملک #محمودآباد #ملک_شمال");
  const instagram = igLines.join("\n");

  return { divar, sheypoor, telegram, whatsapp, instagram };
}

interface SharePanelProps {
  listing: Listing;
  onClose: () => void;
}

export function SharePanel({ listing, onClose }: SharePanelProps) {
  const [copied,    setCopied]    = useState(false);
  const [copiedKey, setCopiedKey] = useState<TemplateKey | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  const caption   = buildCaption(listing);
  const fullText  = caption;
  const templates = buildTemplates(listing);
  const publicUrl = listingPublicUrl(listing);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#030D1E", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [publicUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: listing.title, text: fullText, url: CHANNEL_URL });
    } catch { /* cancelled */ }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
  };

  const handleCopyTemplate = async (key: TemplateKey) => {
    try {
      await navigator.clipboard.writeText(templates[key]);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const openDivar = async () => {
    await copyToClipboard();
    window.open("https://divar.ir/new", "_blank", "noopener");
  };

  const openSheypoor = async () => {
    await copyToClipboard();
    window.open("https://www.sheypoor.com/listing/new", "_blank", "noopener");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.15 }}
          className="w-full sm:max-w-md bg-[#0A1929] border border-[#1E293B] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col"
        >
          {/* Header — fixed, never scrolls */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1E293B] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-white font-bold text-base">اشتراک‌گذاری آگهی</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            {/* Caption preview */}
            <div
              className="mx-5 mt-4 bg-[#030D1E] border border-[#1E293B] rounded-xl p-3 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[110px] overflow-y-auto"
              dir="rtl"
            >
              {caption}
            </div>

            <div className="p-5 flex flex-col gap-2.5">
              {/* Native OS share sheet (iOS / Android) */}
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  اشتراک‌گذاری سریع — اینستاگرام / واتساپ / تلگرام
                </button>
              )}

              {/* WhatsApp + Telegram quick-share */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(fullText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  واتساپ
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(CHANNEL_URL)}&text=${encodeURIComponent(caption)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 border border-[#2AABEE]/30 text-[#2AABEE] py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  تلگرام
                </a>
              </div>

              {/* Copy combined caption */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#243447] border border-[#1E293B] text-gray-300 py-3 rounded-xl text-sm font-medium transition-all"
              >
                {copied
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <Copy className="w-4 h-4" />}
                {copied ? "کپی شد!" : "کپی متن آگهی"}
              </button>

              {/* Manual post on Divar / Sheypoor */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={openDivar}
                  className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-xl text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ثبت در دیوار
                </button>
                <button
                  onClick={openSheypoor}
                  className="flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 py-3 rounded-xl text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ثبت در شیپور
                </button>
              </div>

              <p className="text-center text-[9px] text-gray-600 mt-0.5">
                برای دیوار و شیپور، متن آگهی کپی می‌شود — پس از باز شدن سایت جای‌گذاری کنید
              </p>
            </div>

            {/* ── QR Code آگهی ─────────────────────────────────────── */}
            <div className="border-t border-[#1E293B] px-5 pb-5">
              <p className="text-[#D4AF37] text-xs font-bold pt-4 mb-3 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                QR Code آگهی
              </p>
              {qrDataUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white rounded-xl p-2">
                    <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
                  </div>
                  <p className="text-[10px] text-gray-500 text-center" dir="ltr">{publicUrl}</p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <a
                      href={qrDataUrl}
                      download={`mahoor-${listing.code ? listing.code.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x30)) : listing.id}-qr.png`}
                      className="flex items-center justify-center gap-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] py-2.5 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      دانلود QR
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-1.5 bg-[#1E293B] hover:bg-[#243447] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                    >
                      {linkCopied
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5" />}
                      {linkCopied ? "کپی شد!" : "کپی لینک"}
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-gray-600">
                    برای چاپ روی بنر، تراکت یا برچسب ویترین — اسکن → صفحه آگهی
                  </p>
                </div>
              ) : (
                <p className="text-center text-xs text-gray-600 py-4">در حال ساخت QR…</p>
              )}
            </div>

            {/* ── متن آماده انتشار ─────────────────────────────────── */}
            <div className="border-t border-[#1E293B] px-5 pb-6">
              <p className="text-[#D4AF37] text-xs font-bold pt-4 mb-3">متن آماده انتشار</p>
              <div className="flex flex-col gap-3">
                {TEMPLATE_LABELS.map(({ id, label }) => (
                  <div key={id} className="bg-[#030D1E] border border-[#1E293B] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{label}</span>
                      <button
                        onClick={() => handleCopyTemplate(id)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-[#243447] text-gray-300 transition-colors"
                      >
                        {copiedKey === id ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            کپی شد ✅
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            کپی
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={templates[id]}
                      rows={4}
                      dir="rtl"
                      className="w-full bg-transparent text-[10px] text-gray-400 leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
