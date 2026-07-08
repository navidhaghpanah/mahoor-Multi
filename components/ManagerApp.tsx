"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, CheckCircle, Clock, Building2,
  RefreshCw, Loader2, TrendingUp, Eye, MousePointerClick,
  LogOut, Sparkles, Star, ArrowRight, AlertCircle,
  Phone, ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import { fetchPendingListings, approveListing, type Listing } from "../lib/listings";
import { AiAssistant } from "./AiAssistant";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentListing {
  id: number;
  title: string;
  location: string;
  type: string;
  price: number;
  isManagerApproved: boolean;
  imageUrl: string | null;
  timestamp: string | null;
}

interface AdvisorStats {
  id: number;
  fullName: string;
  phoneNumber: string;
  currentPlan: string;
  agencyName: string;
  title?: string | null;
  totalListings: number;
  approved: number;
  pending: number;
  byType: Record<string, number>;
  totalViews: number;
  totalLeads: number;
  totalClicks: number;
  avgPrice: number;
  lastActivity: string | null;
  recentListings: RecentListing[];
}

interface ManagerStatsData {
  totals: {
    totalListings: number;
    totalApproved: number;
    totalPending: number;
    totalAdvisors: number;
    totalViews: number;
    totalLeads: number;
  };
  advisors: AdvisorStats[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatPrice = (p: number) => {
  if (!p) return "—";
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} میلیارد`;
  if (p >= 1_000_000)     return `${Math.round(p / 1_000_000)} میلیون`;
  return p.toLocaleString("fa-IR");
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fa-IR", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
};

const TYPE_COLORS: Record<string, string> = {
  "آپارتمان": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "ویلا":     "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "زمین":     "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "تجاری":   "text-purple-400 bg-purple-400/10 border-purple-400/30",
};
const typeStyle = (t: string) =>
  TYPE_COLORS[t] ?? "text-gray-400 bg-gray-400/10 border-gray-400/30";

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent = "gold", icon: Icon,
}: {
  label: string; value: string | number; sub?: string;
  accent?: "gold" | "red" | "green" | "blue"; icon: React.FC<any>;
}) {
  const colors = {
    gold:  { val: "text-[#D4AF37]", bg: "bg-[#D4AF37]/5",  border: "border-[#D4AF37]/20" },
    red:   { val: "text-red-400",   bg: "bg-red-400/5",     border: "border-red-400/20"   },
    green: { val: "text-green-400", bg: "bg-green-400/5",   border: "border-green-400/20" },
    blue:  { val: "text-blue-400",  bg: "bg-blue-400/5",    border: "border-blue-400/20"  },
  }[accent];

  return (
    <div className={`rounded-2xl p-5 border ${colors.bg} ${colors.border} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">{label}</span>
        <Icon className={`w-4 h-4 ${colors.val}`} />
      </div>
      <span className={`text-3xl font-bold ${colors.val}`}>{value}</span>
      {sub && <span className="text-gray-500 text-xs">{sub}</span>}
    </div>
  );
}

// ─── Pending Approval Queue ───────────────────────────────────────────────────

function PendingQueue({
  pending, approvingId, onApprove, onRefresh, loading,
}: {
  pending: Listing[];
  approvingId: string | null;
  onApprove: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const advisorPending = pending.filter((l) => !l.isPublicSubmission);
  const publicPending  = pending.filter((l) => l.isPublicSubmission);

  const renderCard = (listing: Listing, isPublic: boolean) => (
    <div
      key={listing.id}
      className="flex items-center gap-4 bg-[#1E293B]/60 border border-[#1E293B] hover:border-red-500/20 rounded-xl p-4 transition-colors"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0C1A2E] flex-shrink-0">
        {listing.id
          ? <img src={`/api/listing-image/${listing.id}`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-700" />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
        <p className="text-gray-400 text-xs mt-0.5 truncate">
          {listing.location}
          {listing.price ? ` · ${Number(listing.price).toLocaleString("fa-IR")} تومان` : ""}
        </p>
        <p className="text-gray-600 text-xs mt-0.5">
          {isPublic
            ? <>ارسال‌کننده: <span dir="ltr">{listing.submitterPhone || "—"}</span> · انتشار با مشخصات حیدری</>
            : <>مشاور: {listing.advisorName || listing.advisorPhone || "—"}</>
          }
        </p>
      </div>
      <button
        onClick={() => listing.id && onApprove(listing.id)}
        disabled={approvingId === listing.id}
        className="flex-shrink-0 flex items-center gap-1.5 bg-green-600/15 hover:bg-green-600 border border-green-600/30 hover:border-green-600 text-green-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
      >
        {approvingId === listing.id
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <CheckCircle className="w-3.5 h-3.5" />
        }
        تأیید
      </button>
    </div>
  );

  return (
    <div className="bg-[#0C1A2E] border border-[#1E293B] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-400" />
          صف تأیید آگهی‌ها
          {pending.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-bold border border-red-500/30">
              {pending.length} در انتظار
            </span>
          )}
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <CheckCircle className="w-10 h-10 mb-2 text-green-600/40" />
          <p className="text-sm">هیچ آگهی در انتظار تأیید وجود ندارد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {advisorPending.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                آگهی‌های مشاورین
                <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded-full">{advisorPending.length}</span>
              </p>
              <div className="flex flex-col gap-3">
                {advisorPending.map((l) => renderCard(l, false))}
              </div>
            </div>
          )}
          {publicPending.length > 0 && (
            <div>
              <p className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">
                آگهی‌های ارسالی عمومی
                <span className="bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">{publicPending.length}</span>
              </p>
              <div className="flex flex-col gap-3">
                {publicPending.map((l) => renderCard(l, true))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Home / Dashboard Tab ─────────────────────────────────────────────────────

function HomeTab({
  stats, pending, approvingId, onApprove, onRefresh, loading,
}: {
  stats: ManagerStatsData | null;
  pending: Listing[];
  approvingId: string | null;
  onApprove: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const t = stats?.totals;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">داشبورد مدیریتی</h1>
        <p className="text-gray-500 text-sm">نمای کلی سیستم — آگهی‌ها، مشاورین و صف تأیید</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="کل آگهی‌ها"
          value={t?.totalListings ?? "—"}
          sub={`${t?.totalApproved ?? 0} منتشر شده`}
          accent="gold"
          icon={Building2}
        />
        <KpiCard
          label="در انتظار تأیید"
          value={t?.totalPending ?? "—"}
          sub="نیاز به بررسی"
          accent={t && t.totalPending > 0 ? "red" : "green"}
          icon={Clock}
        />
        <KpiCard
          label="مشاورین فعال"
          value={t?.totalAdvisors ?? "—"}
          accent="blue"
          icon={Users}
        />
        <KpiCard
          label="کل بازدیدها"
          value={t?.totalViews ?? "—"}
          sub={`${t?.totalLeads ?? 0} سرنخ`}
          accent="green"
          icon={Eye}
        />
      </div>

      {/* Pending queue — front and center */}
      <PendingQueue
        pending={pending}
        approvingId={approvingId}
        onApprove={onApprove}
        onRefresh={onRefresh}
        loading={loading}
      />

      {/* Advisor quick-summary */}
      {stats && stats.advisors.length > 0 && (
        <div className="bg-[#0C1A2E] border border-[#1E293B] rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            عملکرد مشاورین (خلاصه)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.advisors.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-[#1E293B]/50 rounded-xl p-3 border border-[#1E293B]">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] text-sm font-bold">
                    {a.fullName.slice(0, 1)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{a.fullName}</p>
                  <p className="text-gray-500 text-xs">
                    {a.totalListings} آگهی
                    {a.pending > 0 && (
                      <span className="text-red-400 mr-1">· {a.pending} در انتظار</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-400 text-xs">{a.totalViews} بازدید</p>
                  <p className="text-gray-500 text-xs">{a.totalLeads} سرنخ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Advisor Detail View ───────────────────────────────────────────────────────

function AdvisorDetail({ advisor, onBack, managerPhone }: { advisor: AdvisorStats; onBack: () => void; managerPhone?: string }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 flex-shrink-0 w-9 h-9 rounded-xl bg-[#1E293B] border border-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">{advisor.fullName}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {advisor.title && (
              <span className="text-[10px] bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-medium">
                {advisor.title}
              </span>
            )}
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">{advisor.phoneNumber}</span>
            </span>
            <button
              onClick={async () => {
                if (!confirm(`بازنشانی PIN برای ${advisor.fullName}؟`)) return;
                const res = await fetch('/api/admin/reset-pin', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ managerPhone, targetPhone: advisor.phoneNumber }),
                });
                alert(res.ok ? 'PIN بازنشانی شد' : 'خطا در بازنشانی PIN');
              }}
              className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-2 py-0.5 rounded-full font-medium transition-colors"
            >
              بازنشانی PIN
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "کل آگهی", value: advisor.totalListings, color: "text-white" },
          { label: "تأیید شده", value: advisor.approved,     color: "text-green-400" },
          { label: "در انتظار",  value: advisor.pending,      color: advisor.pending > 0 ? "text-red-400" : "text-gray-500" },
          { label: "بازدید",    value: advisor.totalViews,   color: "text-blue-400" },
          { label: "سرنخ",      value: advisor.totalLeads,   color: "text-[#D4AF37]" },
          { label: "کلیک",      value: advisor.totalClicks,  color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0C1A2E] border border-[#1E293B] rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Avg price + last activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0C1A2E] border border-[#1E293B] rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">میانگین قیمت آگهی‌ها</p>
          <p className="text-xl font-bold text-[#D4AF37]">
            {advisor.avgPrice ? `${formatPrice(advisor.avgPrice)} تومان` : "—"}
          </p>
        </div>
        <div className="bg-[#0C1A2E] border border-[#1E293B] rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">آخرین فعالیت</p>
          <p className="text-xl font-bold text-white">{formatDate(advisor.lastActivity)}</p>
        </div>
      </div>

      {/* Type breakdown */}
      {Object.keys(advisor.byType).length > 0 && (
        <div className="bg-[#0C1A2E] border border-[#1E293B] rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">توزیع نوع ملک</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(advisor.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const pct = advisor.totalListings > 0
                  ? Math.round((count / advisor.totalListings) * 100)
                  : 0;
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${typeStyle(type)}`}
                  >
                    <span>{type}</span>
                    <span className="font-bold">{count}</span>
                    <span className="opacity-60 text-xs">({pct}٪)</span>
                  </div>
                );
              })}
          </div>
          {/* Visual bar */}
          <div className="mt-4 h-2 rounded-full overflow-hidden bg-[#1E293B] flex">
            {Object.entries(advisor.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count], i) => {
                const pct = advisor.totalListings > 0
                  ? (count / advisor.totalListings) * 100
                  : 0;
                const bg = ["bg-blue-500","bg-emerald-500","bg-amber-500","bg-purple-500","bg-gray-500"][i] ?? "bg-gray-500";
                return (
                  <div
                    key={type}
                    className={`${bg} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${type}: ${count}`}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Recent listings */}
      {advisor.recentListings.length > 0 && (
        <div className="bg-[#0C1A2E] border border-[#1E293B] rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#D4AF37]" />
            آخرین آگهی‌های ثبت‌شده
          </h3>
          <div className="flex flex-col gap-2.5">
            {advisor.recentListings.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 bg-[#1E293B]/50 rounded-xl p-3 border border-[#1E293B]"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0C1A2E] flex-shrink-0">
                  {l.id
                    ? <img src={`/api/listing-image/${l.id}`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-700" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{l.title}</p>
                  <p className="text-gray-500 text-xs truncate">{l.location}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {l.type && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeStyle(l.type)}`}>
                      {l.type}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold ${l.isManagerApproved ? "text-green-400" : "text-red-400"}`}>
                    {l.isManagerApproved ? "تأیید شده" : "در انتظار"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {advisor.totalListings === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Building2 className="w-12 h-12 mb-3 opacity-30" />
          <p>این مشاور هنوز آگهی‌ای ثبت نکرده است</p>
        </div>
      )}
    </div>
  );
}

// ─── Advisors Tab ─────────────────────────────────────────────────────────────

function AdvisorsTab({
  advisors, onSelect,
}: {
  advisors: AdvisorStats[];
  onSelect: (a: AdvisorStats) => void;
}) {
  if (advisors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-600">
        <Users className="w-12 h-12 mb-3 opacity-30" />
        <p>هیچ مشاوری در سیستم ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">عملکرد مشاورین</h1>
        <p className="text-gray-500 text-sm">سابقه و آمار آگهی‌های هر مشاور — برای جزئیات کلیک کنید</p>
      </div>

      {/* Summary comparison row */}
      <div className="grid grid-cols-1 gap-4">
        {advisors.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="w-full text-right bg-[#0C1A2E] border border-[#1E293B] hover:border-[#D4AF37]/30 rounded-2xl p-5 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#D4AF37] text-xl font-bold">
                  {a.fullName.slice(0, 1)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-bold text-base group-hover:text-[#D4AF37] transition-colors">
                    {a.fullName}
                  </h3>
                  {a.pending > 0 && (
                    <span className="text-[10px] bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full font-bold">
                      {a.pending} در انتظار
                    </span>
                  )}
                </div>
                {a.title && (
                  <p className="text-[#D4AF37]/70 text-xs mt-0.5 font-medium">{a.title}</p>
                )}
                <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{a.phoneNumber}</span>
                </p>
                <p className="text-[#D4AF37]/40 text-xs mt-0.5">{a.currentPlan}</p>

                {/* Type chips */}
                {Object.keys(a.byType).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(a.byType)
                      .sort(([, x], [, y]) => y - x)
                      .map(([type, count]) => (
                        <span
                          key={type}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border ${typeStyle(type)}`}
                        >
                          {type} ({count})
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:grid grid-cols-3 gap-4 flex-shrink-0 text-center">
                <div>
                  <p className="text-white font-bold text-lg">{a.totalListings}</p>
                  <p className="text-gray-600 text-[10px]">کل آگهی</p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold text-lg">{a.totalViews}</p>
                  <p className="text-gray-600 text-[10px]">بازدید</p>
                </div>
                <div>
                  <p className="text-[#D4AF37] font-bold text-lg">{a.totalLeads}</p>
                  <p className="text-gray-600 text-[10px]">سرنخ</p>
                </div>
              </div>

              <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-[#D4AF37] transition-colors flex-shrink-0 mt-1" />
            </div>

            {/* Mobile stats */}
            <div className="sm:hidden mt-3 grid grid-cols-3 gap-2 border-t border-[#1E293B] pt-3">
              <div className="text-center">
                <p className="text-white font-bold">{a.totalListings}</p>
                <p className="text-gray-600 text-[10px]">کل آگهی</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-bold">{a.totalViews}</p>
                <p className="text-gray-600 text-[10px]">بازدید</p>
              </div>
              <div className="text-center">
                <p className="text-[#D4AF37] font-bold">{a.totalLeads}</p>
                <p className="text-gray-600 text-[10px]">سرنخ</p>
              </div>
            </div>

            {/* Last activity */}
            <div className="mt-2 text-right">
              <p className="text-gray-600 text-xs">
                آخرین فعالیت: {formatDate(a.lastActivity)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Manager App ─────────────────────────────────────────────────────────

export function ManagerApp({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [activeTab, setActiveTab]         = useState<"home" | "advisors">("home");
  const [stats, setStats]                 = useState<ManagerStatsData | null>(null);
  const [pending, setPending]             = useState<Listing[]>([]);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorStats | null>(null);
  const [isAiOpen, setIsAiOpen]           = useState(false);

  const loadAll = useCallback(async () => {
    setLoadingStats(true);
    const [statsRes, pendingList] = await Promise.all([
      fetch("/api/manager/stats").then((r) => r.json()).catch(() => null),
      fetchPendingListings(),
    ]);
    setStats(statsRes ?? null);
    setPending(pendingList);
    setLoadingStats(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approveListing(id);
      setPending((prev) => prev.filter((l) => l.id !== id));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totals: {
                ...prev.totals,
                totalPending:  prev.totals.totalPending  - 1,
                totalApproved: prev.totals.totalApproved + 1,
              },
            }
          : null
      );
    } catch {
      alert("خطا در تأیید آگهی");
    } finally {
      setApprovingId(null);
    }
  };

  const goToTab = (tab: "home" | "advisors") => {
    setActiveTab(tab);
    setSelectedAdvisor(null);
  };

  const tabs = [
    { id: "home" as const,    label: "داشبورد",  icon: LayoutDashboard },
    { id: "advisors" as const, label: "مشاورین", icon: Users },
  ];

  const renderContent = () => {
    if (loadingStats && !stats) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      );
    }

    if (activeTab === "home") {
      return (
        <HomeTab
          stats={stats}
          pending={pending}
          approvingId={approvingId}
          onApprove={handleApprove}
          onRefresh={loadAll}
          loading={loadingStats}
        />
      );
    }

    if (activeTab === "advisors") {
      if (selectedAdvisor) {
        return <AdvisorDetail advisor={selectedAdvisor} onBack={() => setSelectedAdvisor(null)} managerPhone={user?.phoneNumber} />;
      }
      return (
        <AdvisorsTab
          advisors={stats?.advisors ?? []}
          onSelect={setSelectedAdvisor}
        />
      );
    }
  };

  return (
    <div
      className="flex flex-col min-h-[100dvh] bg-[#030D1E] overflow-x-hidden md:pr-[280px] pb-[80px] md:pb-0"
      dir="rtl"
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[280px] fixed top-0 bottom-0 right-0 border-l border-[#4A1060]/30 bg-[#0A0018] z-40 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Logo + manager badge */}
        <div className="p-6 border-b border-[#4A1060]/30 bg-gradient-to-b from-[#160028] to-[#0A0018]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 flex-shrink-0">
              <Image src="/logo.jpg" alt="ماهور" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">سامانه مدیریت</h1>
              <p className="text-[10px] text-[#D4AF37]/70">ماهور — محمودآباد</p>
            </div>
          </div>
          {/* Manager identity card */}
          <div className="bg-[#D4AF37]/8 border border-[#D4AF37]/25 rounded-xl p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <p className="text-[#D4AF37] text-xs font-bold leading-tight truncate">
                {user?.fullName ?? "مدیر ارشد"}
              </p>
              <p className="text-[#D4AF37]/50 text-[10px] leading-tight truncate">
                {user?.title ?? "مدیر ارشد سیستم"}
              </p>
            </div>
            <span className="mr-auto bg-[#D4AF37] text-[#0A0018] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
              ADMIN
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1.5 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => goToTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right w-full ${
                  isActive
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_12px_rgba(212,175,55,0.05)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{tab.label}</span>
                {tab.id === "home" && pending.length > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                    {pending.length}
                  </span>
                )}
                {isActive && (
                  <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#4A1060]/30 space-y-2">
          <button
            onClick={() => setIsAiOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 text-[#D4AF37] py-2.5 rounded-xl transition-all group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            <span className="font-medium text-sm">دستیار هوشمند AI</span>
          </button>
          <button
            onClick={() => { if (confirm('از حساب کاربری خارج می‌شوید؟')) onLogout(); }}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-red-400 text-sm py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
          <p className="text-center text-[10px] text-gray-700 tracking-widest font-semibold select-none">NH</p>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 bg-[#0A0018]/95 backdrop-blur-md border-b border-[#4A1060]/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#D4AF37]/20 flex-shrink-0">
              <Image src="/logo.jpg" alt="ماهور" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-white text-sm">سامانه مدیریت</h1>
                <span className="bg-[#D4AF37] text-[#030D1E] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                  ADMIN
                </span>
              </div>
              <p className="text-[9px] text-[#D4AF37]/60">{user?.fullName ?? "مدیر ارشد"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiOpen(true)}
              className="w-9 h-9 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37]"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        {renderContent()}
        <p className="text-center text-[10px] text-gray-700 mt-8 tracking-widest font-semibold select-none md:hidden">NH</p>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0018] border-t border-[#4A1060]/30 flex items-center justify-around pb-safe pt-2 px-1 z-40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => goToTab(tab.id)}
              className="flex flex-col items-center justify-center min-w-[80px] h-14 gap-1 rounded-xl px-2 relative"
            >
              {isActive && (
                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-xl" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? "text-[#D4AF37]" : "text-gray-600"}`} />
                {tab.id === "home" && pending.length > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold z-20">
                    {pending.length > 9 ? "9+" : pending.length}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-semibold relative z-10 ${isActive ? "text-[#D4AF37]" : "text-gray-600"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}
