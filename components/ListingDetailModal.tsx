"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, Bed, Ruler, Phone, Map, Building2, Share2 } from "lucide-react";
import { type Listing } from "../lib/listings";
import { SharePanel } from "./SharePanel";

const BADGE: Record<string, { label: string; color: string }> = {
  sale:     { label: "فروشی",    color: "bg-red-500" },
  rent:     { label: "اجاره‌ای", color: "bg-blue-500" },
  mortgage: { label: "رهن کامل", color: "bg-green-600" },
  presale:  { label: "پیش‌فروش", color: "bg-purple-600" },
};

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  onShowMap: (listing: Listing) => void;
}

export function ListingDetailModal({ listing, onClose, onShowMap }: ListingDetailModalProps) {
  const [showShare, setShowShare] = useState(false);
  if (!listing) return null;
  const badge = BADGE[listing.deal] ?? { label: listing.deal, color: "bg-gray-600" };

  return (
    <AnimatePresence>
      {listing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15 }}
            className="w-full sm:max-w-xl bg-[#0C2C54] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-[#1E293B] shadow-2xl max-h-[92dvh] flex flex-col"
          >
            {/* Image */}
            <div className="relative h-[200px] flex-shrink-0 bg-[#1E293B]">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-14 h-14 text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C2C54] via-transparent to-transparent" />
              <span className={`absolute top-4 right-4 ${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                {badge.label}
              </span>
              <button
                onClick={onClose}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
              {/* Title & Price */}
              <div>
                <h2 className="text-white font-bold text-lg leading-relaxed mb-1">{listing.title}</h2>
                <p className="text-[#D4AF37] text-2xl font-bold">{listing.price}</p>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span>{listing.location}</span>
              </div>

              {/* Stats row */}
              <div className="flex gap-5 py-3 border-y border-[#1E293B]">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Ruler className="w-4 h-4 text-[#D4AF37]" />
                  <span>{listing.size} متر</span>
                </div>
                {listing.beds > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Bed className="w-4 h-4 text-[#D4AF37]" />
                    <span>{listing.beds} خواب</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className={`w-2.5 h-2.5 rounded-full ${badge.color}`} />
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Description */}
              {listing.desc && (
                <p className="text-gray-400 text-sm leading-relaxed">{listing.desc}</p>
              )}

              {/* Advisor */}
              <div className="flex items-center gap-3 bg-[#0A2040]/60 border border-[#1E293B] rounded-xl p-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1a3c6e] to-[#D4AF37]/40 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                  {(listing.advisorName ?? "م")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{listing.advisorName ?? "کارشناس ماهور"}</p>
                  <p className="text-gray-500 text-xs">کارشناس ملکی</p>
                </div>
                <a
                  href={`tel:${listing.advisorPhone ?? listing.phone}`}
                  className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-600/40 hover:border-green-600 text-green-400 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  تماس
                </a>
              </div>

              {/* Show on map — only when real coordinates exist */}
              {listing.lat && listing.lng && (
                <button
                  onClick={() => { onClose(); onShowMap(listing); }}
                  className="w-full flex items-center justify-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] py-3 rounded-xl text-sm font-medium transition-all"
                >
                  <Map className="w-4 h-4" />
                  نمایش روی نقشه
                </button>
              )}

              {/* Share button */}
              <button
                onClick={() => setShowShare(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#243447] border border-[#1E293B] text-gray-300 hover:text-white py-3 rounded-xl text-sm font-medium transition-all"
              >
                <Share2 className="w-4 h-4" />
                اشتراک‌گذاری / نشر آگهی
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Share panel */}
      {showShare && (
        <SharePanel listing={listing} onClose={() => setShowShare(false)} />
      )}
    </AnimatePresence>
  );
}
