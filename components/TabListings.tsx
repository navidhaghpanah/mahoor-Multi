"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Filter, MapPin, Bed, Car, Ruler, Heart, Phone,
  Home, Building2, TreePine, Store, ChevronDown, X, Map, Loader2, Share2,
} from "lucide-react";
import { subscribeToListings, type Listing } from "../lib/listings";
import { MapModal } from "./MapModal";
import { ListingDetailModal } from "./ListingDetailModal";
import { SharePanel } from "./SharePanel";
import { formatPrice, formatNumber, toPersianDigits } from "../lib/format";


const BADGE: Record<string, { label: string; color: string }> = {
  sale:         { label: "فروشی",           color: "bg-red-500" },
  rent:         { label: "اجاره‌ای",        color: "bg-blue-500" },
  mortgage:     { label: "رهن کامل",        color: "bg-green-600" },
  presale:      { label: "پیش‌فروش",        color: "bg-purple-600" },
  "daily-rent": { label: "اجاره شبانه",     color: "bg-orange-500" },
};

const DEAL_TYPES = ["all", "sale", "rent", "mortgage", "presale", "daily-rent"];
const DEAL_LABELS: Record<string, string> = { all:"همه", sale:"فروشی", rent:"اجاره", mortgage:"رهن", presale:"پیش‌فروش", "daily-rent":"اجاره شبانه" };

const PROP_TYPES = [
  { id: "all",       label: "همه",       Icon: Home },
  { id: "apartment", label: "آپارتمان",  Icon: Building2 },
  { id: "villa",     label: "ویلا",      Icon: Home },
  { id: "land",      label: "زمین",      Icon: TreePine },
  { id: "commercial",label: "تجاری",     Icon: Store },
];

export function TabListings() {
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [dealFilter, setDealFilter] = useState("all");
  const [propFilter, setPropFilter] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [firestoreListings, setFirestoreListings] = useState<Listing[]>([]);
  const [mapListing, setMapListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [shareListing, setShareListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToListings((data) => {
      setFirestoreListings(data);
      setLoading(false);
    });
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const allListings = firestoreListings;

  const filtered = allListings.filter((l) => {
    const matchDeal = dealFilter === "all" || l.deal === dealFilter;
    const matchProp = propFilter === "all" || l.propType === propFilter;
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase());
    return matchDeal && matchProp && matchSearch;
  });

  // Card click → the dedicated public listing page (same page as the site)
  const openListingPage = (l: Listing) => {
    if (l.id) {
      const n = parseInt(l.id, 10);
      if (n > 0) { router.push(`/p/MH-${String(n).padStart(4, "0")}`); return; }
    }
    setDetailListing(l); // fallback: modal for listings without a numeric id
  };

  const toggleFav = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">آگهی‌های ملکی</h1>
          <p className="text-[#a0b0c0] text-sm">
            {loading ? "در حال بارگذاری..." : `${filtered.length} ملک یافت شد`}
          </p>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />}
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در محمودآباد..."
            className="w-full bg-[#0C2C54]/60 border border-[#1E293B] rounded-xl pr-11 pl-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
            showFilters || dealFilter !== "all" || propFilter !== "all"
              ? "bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]"
              : "bg-[#0C2C54]/60 border-[#1E293B] text-gray-400 hover:text-white"
          }`}
        >
          <Filter className="w-4 h-4" />
          فیلتر
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">نوع معامله</p>
                <div className="flex flex-wrap gap-2">
                  {DEAL_TYPES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDealFilter(d)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        dealFilter === d ? "bg-[#D4AF37] text-black" : "bg-[#1E293B] text-gray-300 hover:bg-[#1E293B]/80"
                      }`}
                    >
                      {DEAL_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">نوع ملک</p>
                <div className="flex flex-wrap gap-2">
                  {PROP_TYPES.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPropFilter(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        propFilter === id ? "bg-[#D4AF37] text-black" : "bg-[#1E293B] text-gray-300 hover:bg-[#1E293B]/80"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {(dealFilter !== "all" || propFilter !== "all") && (
                <button
                  onClick={() => { setDealFilter("all"); setPropFilter("all"); }}
                  className="self-start text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> پاک کردن فیلترها
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Search className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-semibold">ملکی پیدا نشد</p>
          <p className="text-sm mt-1">فیلترها را تغییر دهید</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((listing, i) => {
            const badge = BADGE[listing.deal] ?? { label: listing.deal, color: "bg-gray-600" };
            const favId = listing.id ?? i.toString();
            return (
              <motion.div
                key={listing.id ?? i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#0C2C54]/50 border border-[#1E293B] rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                onClick={() => openListingPage(listing)}
              >
                {/* Image */}
                <div className="relative h-[200px] overflow-hidden bg-[#1E293B]">
                  {listing.id ? (
                    <img
                      src={`/api/listing-image/${listing.id}`}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className={`absolute top-3 right-3 ${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {badge.label}
                  </span>

                  {/* Map + Share + Fav buttons */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {listing.lat && listing.lng && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMapListing(listing); }}
                        className="w-8 h-8 rounded-full bg-black/40 text-white/80 hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition-all"
                        title="نمایش روی نقشه"
                      >
                        <Map className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShareListing(listing); }}
                      className="w-8 h-8 rounded-full bg-black/40 text-white/80 hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition-all"
                      title="اشتراک‌گذاری"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFav(favId); }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        favorites.has(favId) ? "bg-red-500 text-white" : "bg-black/40 text-white/70 hover:bg-black/60"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.has(favId) ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{listing.location}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-sm leading-relaxed line-clamp-2">
                      {listing.title}
                    </h3>
                    {listing.code && (
                      <span className="flex-shrink-0 text-[9px] font-mono text-gray-500" dir="ltr">{listing.code}</span>
                    )}
                  </div>
                  <p className="text-[#D4AF37] text-lg font-bold mb-1">
                    {formatPrice(listing.price)}
                  </p>
                  {listing.desc && (
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{listing.desc}</p>
                  )}

                  {/* Features */}
                  <div className="flex gap-4 pt-3 border-t border-[#1E293B] mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Ruler className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {formatNumber(listing.size)} متر
                    </div>
                    {listing.beds > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Bed className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {toPersianDigits(listing.beds)} خواب
                      </div>
                    )}
                    {listing.lat && listing.lng && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMapListing(listing); }}
                        className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-white transition-colors"
                      >
                        <Map className="w-3.5 h-3.5" />
                        نقشه
                      </button>
                    )}
                  </div>

                  {/* Agent */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1E293B]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a3c6e] to-[#D4AF37]/40 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(listing.advisorName ?? "م")[0]}
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">{listing.advisorName ?? "کارشناس ماهور"}</p>
                        <p className="text-gray-500 text-[10px]">کارشناس ملکی</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${listing.advisorPhone ?? listing.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-600/40 hover:border-green-600 text-green-400 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      تماس
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={detailListing}
        onClose={() => setDetailListing(null)}
        onShowMap={(l) => setMapListing(l)}
      />

      {/* Share panel (triggered from card share icon) */}
      {shareListing && (
        <SharePanel listing={shareListing} onClose={() => setShareListing(null)} />
      )}

      {/* Map Modal */}
      <MapModal
        isOpen={!!mapListing}
        onClose={() => setMapListing(null)}
        location={mapListing?.location ?? ""}
        lat={mapListing?.lat}
        lng={mapListing?.lng}
        title={mapListing?.title}
      />
    </div>
  );
}
