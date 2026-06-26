"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Filter, MapPin, Bed, Car, Ruler, Heart, Phone,
  Home, Building2, TreePine, Store, ChevronDown, X,
} from "lucide-react";

const LISTINGS = [
  {
    id: 1, type: "sale", propType: "apartment",
    title: "آپارتمان ۱۲۰ متری نوساز - ۳ خواب",
    price: "۲.۵ میلیارد تومان", priceLabel: "قیمت کل",
    location: "خیابان امام، محمودآباد",
    size: 120, beds: 3, hasParking: true, hasElevator: true,
    agent: "عزیزپور", agentPhone: "09111134767",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop",
    badge: "فروشی", badgeColor: "bg-red-500",
  },
  {
    id: 2, type: "sale", propType: "villa",
    title: "ویلای دوبلکس ساحلی - ۲۰۰ متر زمین",
    price: "۵.۸ میلیارد تومان", priceLabel: "قیمت کل",
    location: "نسیم، محمودآباد",
    size: 180, beds: 4, hasParking: true, hasElevator: false,
    agent: "مهندس آزاد", agentPhone: "09113276667",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop",
    badge: "فروشی", badgeColor: "bg-red-500",
  },
  {
    id: 3, type: "rent", propType: "apartment",
    title: "آپارتمان ۸۵ متری مبله - ۲ خواب",
    price: "۵ میلیون", priceLabel: "ماهانه",
    location: "خیابان ساحل، محمودآباد",
    size: 85, beds: 2, hasParking: false, hasElevator: true,
    agent: "رضایی", agentPhone: "09195183950",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop",
    badge: "اجاره‌ای", badgeColor: "bg-blue-500",
  },
  {
    id: 4, type: "mortgage", propType: "apartment",
    title: "آپارتمان ۱۰۵ متری رهن کامل - ۳ خواب",
    price: "۴۰۰ میلیون", priceLabel: "رهن کامل",
    location: "مرکز شهر، محمودآباد",
    size: 105, beds: 3, hasParking: true, hasElevator: true,
    agent: "عزیزپور", agentPhone: "09111134767",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop",
    badge: "رهن کامل", badgeColor: "bg-green-600",
  },
  {
    id: 5, type: "presale", propType: "apartment",
    title: "برج مسکونی لاکچری - پیش‌فروش ویژه",
    price: "۱۸ میلیون / متر", priceLabel: "هر متر",
    location: "فاز جدید، محمودآباد",
    size: 90, beds: 2, hasParking: true, hasElevator: true,
    agent: "مهندس آزاد", agentPhone: "09113276667",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop",
    badge: "پیش‌فروش", badgeColor: "bg-purple-600",
  },
  {
    id: 6, type: "sale", propType: "land",
    title: "زمین ۳۰۰ متری سند دار - موقعیت عالی",
    price: "۹۰۰ میلیون", priceLabel: "قیمت کل",
    location: "حومه، محمودآباد",
    size: 300, beds: 0, hasParking: false, hasElevator: false,
    agent: "رضایی", agentPhone: "09195183950",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop",
    badge: "فروشی", badgeColor: "bg-red-500",
  },
];

const DEAL_TYPES = [
  { id: "all", label: "همه" },
  { id: "sale", label: "فروشی" },
  { id: "rent", label: "اجاره" },
  { id: "mortgage", label: "رهن" },
  { id: "presale", label: "پیش‌فروش" },
];

const PROP_TYPES = [
  { id: "all", label: "همه", Icon: Home },
  { id: "apartment", label: "آپارتمان", Icon: Building2 },
  { id: "villa", label: "ویلا", Icon: Home },
  { id: "land", label: "زمین", Icon: TreePine },
  { id: "commercial", label: "تجاری", Icon: Store },
];

export function TabListings() {
  const [search, setSearch] = useState("");
  const [dealFilter, setDealFilter] = useState("all");
  const [propFilter, setPropFilter] = useState("all");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filtered = LISTINGS.filter((l) => {
    const matchDeal = dealFilter === "all" || l.type === dealFilter;
    const matchProp = propFilter === "all" || l.propType === propFilter;
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase());
    return matchDeal && matchProp && matchSearch;
  });

  const toggleFav = (id: number) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">آگهی‌های ملکی</h1>
        <p className="text-[#a0b0c0] text-sm">محمودآباد و اطراف — {filtered.length} ملک یافت شد</p>
      </div>

      {/* Search + Filter Toggle */}
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
                      key={d.id}
                      onClick={() => setDealFilter(d.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        dealFilter === d.id
                          ? "bg-[#D4AF37] text-black"
                          : "bg-[#1E293B] text-gray-300 hover:bg-[#1E293B]/80"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">نوع ملک</p>
                <div className="flex flex-wrap gap-2">
                  {PROP_TYPES.map((p) => {
                    const Icon = p.Icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPropFilter(p.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          propFilter === p.id
                            ? "bg-[#D4AF37] text-black"
                            : "bg-[#1E293B] text-gray-300 hover:bg-[#1E293B]/80"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {p.label}
                      </button>
                    );
                  })}
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
          {filtered.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0C2C54]/50 border border-[#1E293B] rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative h-[200px] overflow-hidden bg-[#1E293B]">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className={`absolute top-3 right-3 ${listing.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {listing.badge}
                </span>
                <button
                  onClick={() => toggleFav(listing.id)}
                  className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    favorites.has(listing.id)
                      ? "bg-red-500 text-white"
                      : "bg-black/40 text-white/70 hover:bg-black/60"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favorites.has(listing.id) ? "fill-current" : ""}`} />
                </button>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{listing.location}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="font-bold text-white text-sm mb-2 leading-relaxed">{listing.title}</h3>
                <p className="text-[#D4AF37] text-lg font-bold mb-1">
                  {listing.price}
                  <span className="text-xs text-gray-400 font-normal mr-1">/ {listing.priceLabel}</span>
                </p>

                {/* Features */}
                <div className="flex gap-4 pt-3 border-t border-[#1E293B] mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Ruler className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {listing.size} متر
                  </div>
                  {listing.beds > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Bed className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {listing.beds} خواب
                    </div>
                  )}
                  {listing.hasParking && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Car className="w-3.5 h-3.5 text-[#D4AF37]" />
                      پارکینگ
                    </div>
                  )}
                </div>

                {/* Agent */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a3c6e] to-[#D4AF37]/40 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {listing.agent[0]}
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{listing.agent}</p>
                      <p className="text-gray-500 text-[10px]">کارشناس ملکی</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${listing.agentPhone}`}
                    className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-600/40 hover:border-green-600 text-green-400 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    تماس
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
