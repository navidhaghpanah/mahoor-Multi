"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Share2, Copy, CheckCircle2, MessageCircle, Send, ExternalLink } from "lucide-react";
import type { Listing } from "../lib/listings";

const DEAL_LABEL: Record<string, string> = {
  sale:     "فروشی",
  rent:     "اجاره‌ای",
  mortgage: "رهن کامل",
  presale:  "پیش‌فروش",
};

const CHANNEL_URL = "https://t.me/mahooradschannel";

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

interface SharePanelProps {
  listing: Listing;
  onClose: () => void;
}

export function SharePanel({ listing, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const caption  = buildCaption(listing);
  const fullText = caption; // already includes channel URL

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: listing.title, text: fullText, url: CHANNEL_URL });
    } catch {
      /* user cancelled or browser blocked */
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
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
          className="w-full sm:max-w-md bg-[#0A1929] border border-[#1E293B] rounded-t-3xl sm:rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1E293B]">
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

          {/* Caption preview */}
          <div className="mx-5 mt-4 bg-[#030D1E] border border-[#1E293B] rounded-xl p-3 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[110px] overflow-y-auto" dir="rtl">
            {caption}
          </div>

          <div className="p-5 flex flex-col gap-2.5">
            {/* Native OS share sheet (primary — iOS/Android) */}
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                اشتراک‌گذاری سریع — اینستاگرام / واتساپ / تلگرام
              </button>
            )}

            {/* WhatsApp + Telegram */}
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

            {/* Copy caption */}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
