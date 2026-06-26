"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, MapPin, Navigation } from "lucide-react";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  lat?: number;
  lng?: number;
  title?: string;
}

export function MapModal({ isOpen, onClose, location, lat, lng, title }: MapModalProps) {
  const defaultLat = lat ?? 36.6333;
  const defaultLng = lng ?? 52.2607;
  const zoom = lat ? 16 : 13;

  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html?` +
    `bbox=${defaultLng - 0.01},${defaultLat - 0.01},${defaultLng + 0.01},${defaultLat + 0.01}` +
    `&layer=mapnik&marker=${defaultLat},${defaultLng}`;

  const googleMapsUrl = lat
    ? `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}`
    : `https://www.google.com/maps/search/${encodeURIComponent(location + " محمودآباد مازندران")}`;

  const wazeUrl = lat
    ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(location)}`;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full sm:max-w-xl bg-[#0C2C54] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-[#1E293B] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  {title && <p className="text-white font-bold text-sm">{title}</p>}
                  <p className="text-gray-400 text-xs">{location}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Map iframe */}
            <div className="relative h-[320px] bg-[#1E293B]">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title="موقعیت ملک"
                loading="lazy"
              />
              <div className="absolute inset-0 pointer-events-none border border-[#D4AF37]/10" />
            </div>

            {/* Navigation Buttons */}
            <div className="p-4 flex gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 py-3 rounded-xl text-sm font-medium transition-all"
              >
                <Navigation className="w-4 h-4" />
                گوگل مپ
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 py-3 rounded-xl text-sm font-medium transition-all"
              >
                <Navigation className="w-4 h-4" />
                Waze
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://maps.app.goo.gl/Dv4UxLHXSBrPe1xbA`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] py-3 rounded-xl text-sm font-medium transition-all"
              >
                <MapPin className="w-4 h-4" />
                دفتر ماهور
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
