"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  LogOut, Star, Home, Phone, Building2, Loader2,
  CheckCircle2, Clock, Trash2, TrendingUp, BadgeCheck, Zap,
} from "lucide-react";
import { subscribeToListings, deleteListing, type Listing } from "../lib/listings";

const toPersian = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

const PLAN_COLORS: Record<string, string> = {
  "طلایی":     "from-[#D4AF37] to-[#B8962E]",
  "پلاتینیوم": "from-[#e2e8f0] to-[#94a3b8]",
  "نقره‌ای":   "from-[#94a3b8] to-[#64748b]",
  "رایگان":    "from-[#4ade80] to-[#16a34a]",
};

export function TabProfile({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [myListings, setMyListings]   = useState<Listing[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [showListings, setShowListings] = useState(false);

  useEffect(() => {
    const unsub = subscribeToListings((all) => {
      const mine = all.filter(
        (l) => l.advisorPhone === user?.phoneNumber || l.phone === user?.phoneNumber
      );
      setMyListings(mine);
      setLoadingList(false);
    });
    return unsub;
  }, [user?.phoneNumber]);

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این آگهی مطمئن هستید؟")) return;
    setDeletingId(id);
    try { await deleteListing(id); } catch { alert("خطا در حذف"); }
    setDeletingId(null);
  };

  const planGrad = PLAN_COLORS[user?.currentPlan] ?? PLAN_COLORS["رایگان"];
  const initials = (user?.fullName ?? "م").split(" ").map((w: string) => w[0]).join("").slice(0, 2);

  const stats = [
    { label: "آگهی ثبت‌شده",       value: toPersian(myListings.length),                    Icon: Home },
    { label: "تأیید شده",           value: toPersian(myListings.filter(l => l.status === "approved").length), Icon: CheckCircle2 },
    { label: "در انتظار تأیید",     value: toPersian(myListings.filter(l => l.status === "pending").length),  Icon: Clock },
    { label: "سقف آگهی",           value: `${toPersian(user?.adsLimitRemaining ?? 0)} / ${toPersian(user?.totalAdsAllowed ?? 0)}`, Icon: TrendingUp },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10">

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0C2C54] border border-[#1E293B] rounded-2xl overflow-hidden relative"
      >
        {/* Gold top stripe */}
        <div className={`h-1.5 bg-gradient-to-r ${planGrad}`} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-bl-full -z-0 pointer-events-none" />

        <div className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl border-2 border-[#D4AF37]/60 bg-gradient-to-br from-[#1a3c6e] to-[#0C2C54] flex items-center justify-center text-3xl font-bold text-[#D4AF37] flex-shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            {initials}
          </div>

          <div className="text-center md:text-right flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{user?.fullName ?? "کاربر"}</h2>
            <p className="text-[#a0b0c0] text-sm mb-1">{user?.agencyName}</p>
            {user?.licenseNumber && (
              <p className="text-[#a0b0c0] text-xs mb-1">شماره پروانه: {user.licenseNumber}</p>
            )}
            {user?.agencyAddress && (
              <p className="text-[#a0b0c0] text-xs mb-3">{user.agencyAddress}</p>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className={`bg-gradient-to-r ${planGrad} text-black px-3 py-1 rounded-full text-xs font-bold`}>
                {user?.currentPlan ?? "رایگان"}
              </span>
              {user?.isManager && (
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> مدیر ارشد
                </span>
              )}
              {user?.phoneNumber && (
                <span className="bg-[#1E293B] text-gray-300 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{user.phoneNumber}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-[#0C2C54]/50 border border-[#1E293B] rounded-2xl p-4 text-center"
          >
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Icon className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Subscription Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`bg-gradient-to-br from-[#0C2C54] to-[#030D1E] border border-[#D4AF37]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(212,175,55,0.08)]`}
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-[#D4AF37] fill-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#D4AF37]">{user?.currentPlan ?? "رایگان"}</h3>
            {user?.planExpiryDate && (
              <p className="text-gray-400 text-sm">انقضا: {user.planExpiryDate}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Row label="سقف آگهی مجاز">
            <span className="text-white font-bold">
              {toPersian(user?.adsLimitRemaining ?? 0)} از {toPersian(user?.totalAdsAllowed ?? 0)}
            </span>
          </Row>
          <Row label="اعتبار همگام‌سازی">
            <span className="text-white font-bold">
              {toPersian(user?.directSyncLimitRemaining ?? 0)} از {toPersian(user?.totalDirectSyncLimit ?? 0)}
            </span>
          </Row>
          <Row label="دستیار هوش مصنوعی">
            <span className="text-[#D4AF37] font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {user?.isManager ? "نامحدود" : "فعال"}
            </span>
          </Row>
        </div>

        <button className="mt-5 w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:opacity-90 text-black font-bold py-3 rounded-xl transition-all shadow-lg">
          ارتباط با پشتیبانی / ارتقاء پلن
        </button>
      </motion.div>

      {/* My Listings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl overflow-hidden"
      >
        <button
          onClick={() => setShowListings(!showListings)}
          className="w-full flex items-center justify-between p-5 text-right"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-bold text-white">آگهی‌های من</span>
            <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs px-2 py-0.5 rounded-full font-bold">
              {toPersian(myListings.length)}
            </span>
          </div>
          <span className={`text-gray-400 transition-transform ${showListings ? "rotate-180" : ""}`}>▾</span>
        </button>

        {showListings && (
          <div className="border-t border-[#1E293B]">
            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
              </div>
            ) : myListings.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">هنوز آگهی ثبت نکرده‌اید</p>
            ) : (
              <div className="p-4 flex flex-col gap-3">
                {myListings.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-4 bg-[#030D1E]/60 border border-[#1E293B] rounded-xl p-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1E293B] flex-shrink-0">
                      {l.imageUrl
                        ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-600" /></div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{l.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{l.deal} · {l.propType} · {l.location}</p>
                      <div className="mt-1.5">
                        {l.status === "approved"
                          ? <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> تأیید شده</span>
                          : <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> در انتظار تأیید</span>
                        }
                      </div>
                    </div>

                    <button
                      onClick={() => l.id && handleDelete(l.id)}
                      disabled={deletingId === l.id}
                      className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                    >
                      {deletingId === l.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 px-6 py-3 rounded-xl transition-colors font-bold justify-center border border-red-500/20 hover:border-red-500/40"
      >
        <LogOut className="w-5 h-5" />
        خروج از پنل
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-[#1E293B] pb-3">
      <span className="text-gray-400">{label}</span>
      {children}
    </div>
  );
}
