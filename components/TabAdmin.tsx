"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2, XCircle, Building2, Loader2, Clock, Phone, ShieldCheck,
} from "lucide-react";
import { subscribeToListings, updateListingStatus, type Listing } from "../lib/listings";

const toPersian = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export function TabAdmin() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToListings((all) => {
      setListings(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const pending  = listings.filter((l) => l.status === "pending");
  const approved = listings.filter((l) => l.status === "approved");
  const rejected = listings.filter((l) => l.status === "rejected");

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try { await updateListingStatus(id, "approved"); } catch { alert("خطا در تأیید"); }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("آیا این آگهی رد شود؟")) return;
    setProcessingId(id);
    try { await updateListingStatus(id, "rejected"); } catch { alert("خطا در رد آگهی"); }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0C2C54] border border-[#D4AF37]/30 rounded-2xl p-5 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">پنل مدیریت آگهی‌ها</h2>
          <p className="text-gray-400 text-xs mt-0.5">بررسی و تأیید آگهی‌های کارشناسان</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "در انتظار", value: pending.length,  color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-500/20" },
          { label: "تأیید شده", value: approved.length, color: "text-green-400",  bg: "bg-green-400/10 border-green-500/20" },
          { label: "رد شده",    value: rejected.length, color: "text-red-400",    bg: "bg-red-400/10 border-red-500/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{toPersian(value)}</p>
            <p className="text-[10px] text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      <Section
        title="در انتظار تأیید"
        count={pending.length}
        Icon={Clock}
        iconColor="text-yellow-400"
        borderColor="border-yellow-500/20"
        emptyText="هیچ آگهی منتظر بررسی نیست"
      >
        {pending.map((l) => (
          <ListingCard
            key={l.id} l={l} processingId={processingId}
            onApprove={handleApprove} onReject={handleReject}
          />
        ))}
      </Section>

      {/* Approved */}
      {approved.length > 0 && (
        <Section
          title="تأیید شده"
          count={approved.length}
          Icon={CheckCircle2}
          iconColor="text-green-400"
          borderColor="border-green-500/20"
        >
          {approved.map((l) => (
            <ListingCard
              key={l.id} l={l} processingId={processingId}
              onApprove={handleApprove} onReject={handleReject}
              showApprove={false}
            />
          ))}
        </Section>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <Section
          title="رد شده"
          count={rejected.length}
          Icon={XCircle}
          iconColor="text-red-400"
          borderColor="border-red-500/20"
        >
          {rejected.map((l) => (
            <ListingCard
              key={l.id} l={l} processingId={processingId}
              onApprove={handleApprove} onReject={handleReject}
              showReject={false}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title, count, Icon, iconColor, borderColor, emptyText, children,
}: {
  title: string; count: number; Icon: any; iconColor: string; borderColor: string;
  emptyText?: string; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0C2C54]/40 border ${borderColor} rounded-2xl overflow-hidden`}
    >
      <div className="p-4 border-b border-[#1E293B] flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="font-bold text-white text-sm">{title}</span>
        <span className={`${iconColor} bg-current/10 text-xs px-2 py-0.5 rounded-full font-bold opacity-80`}
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {toPersian(count)}
        </span>
      </div>
      {count === 0 && emptyText
        ? <p className="text-center text-gray-500 py-8 text-sm">{emptyText}</p>
        : <div className="p-4 flex flex-col gap-3">{children}</div>
      }
    </motion.div>
  );
}

function ListingCard({
  l, processingId, onApprove, onReject, showApprove = true, showReject = true,
}: {
  l: Listing; processingId: string | null;
  onApprove: (id: string) => void; onReject: (id: string) => void;
  showApprove?: boolean; showReject?: boolean;
}) {
  const busy = processingId === l.id;
  return (
    <div className="bg-[#030D1E]/60 border border-[#1E293B] rounded-xl p-4 flex gap-4">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1E293B] flex-shrink-0">
        {l.imageUrl
          ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-600" /></div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{l.title}</p>
        <p className="text-gray-400 text-xs mt-0.5">{l.deal} · {l.propType} · {l.location}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
          {l.advisorName && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />{l.advisorName}
            </span>
          )}
          <span className="text-[#D4AF37]/80">{l.price}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        {showApprove && (
          <button
            onClick={() => l.id && onApprove(l.id)} disabled={busy}
            className="w-9 h-9 rounded-xl bg-green-500/10 hover:bg-green-500 border border-green-500/20 hover:border-green-500 text-green-400 hover:text-white flex items-center justify-center transition-all"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
        )}
        {showReject && (
          <button
            onClick={() => l.id && onReject(l.id)} disabled={busy}
            className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          </button>
        )}
        {!showApprove && !showReject && (
          <button
            onClick={() => l.id && onApprove(l.id)} disabled={busy}
            className="w-9 h-9 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 flex items-center justify-center transition-all text-xs"
            title="بازگرداندن به انتظار"
          >
            ↩
          </button>
        )}
      </div>
    </div>
  );
}
