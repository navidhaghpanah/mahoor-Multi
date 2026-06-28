"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from "recharts";
import { IosSimulator } from "./IosSimulator";
import { CheckCircle, Loader2, Clock, Building2, RefreshCw } from "lucide-react";
import { fetchPendingListings, approveListing, type Listing } from "../lib/listings";

const chartData = [
  { name: 'شنبه',      views: 400, leads: 24 },
  { name: 'یک‌شنبه',  views: 300, leads: 13 },
  { name: 'دوشنبه',   views: 200, leads: 98 },
  { name: 'سه‌شنبه',  views: 270, leads: 39 },
  { name: 'چهارشنبه', views: 180, leads: 48 },
  { name: 'پنج‌شنبه', views: 230, leads: 38 },
  { name: 'جمعه',     views: 340, leads: 43 },
];

export function TabAnalytics({ user }: { user?: any }) {
  const [pending, setPending]       = useState<Listing[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [approvingId, setApprovingId]  = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoadingQueue(true);
    const list = await fetchPendingListings();
    setPending(list);
    setLoadingQueue(false);
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approveListing(id);
      // Remove from local queue immediately
      setPending((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("خطا در تأیید آگهی");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">داشبورد مدیریتی و ارزیابی PWA</h1>
        <p className="text-[#a0b0c0]">وضعیت وب‌اپ، فعالیت مشاورین و آمار بازدید منطقه</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Side: Analytics */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0C2C54] border border-[#1E293B] rounded-2xl p-6 flex flex-col shadow-lg shadow-[#0C2C54]/50">
              <span className="text-sm text-gray-400 mb-2">بازدید آگهی‌ها (Traffic Simulator)</span>
              <span className="text-4xl font-bold text-white">۱,۹۲۰</span>
              <span className="text-xs text-[#2ECC71] mt-2 font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3"/> +۱۴٪ نسبت به هفته قبل
              </span>
            </div>
            <div className="bg-[#0C2C54] border border-[#1E293B] rounded-2xl p-6 flex flex-col shadow-lg shadow-[#0C2C54]/50">
              <span className="text-sm text-gray-400 mb-2">سرنخ (Lead & Calls)</span>
              <span className="text-4xl font-bold text-[#D4AF37]">۳۰۳</span>
              <span className="text-xs text-gray-400 mt-2">تماس‌های موفق تولید شده</span>
            </div>
          </div>

          <div className="bg-[#0C2C54] border border-[#1E293B] rounded-2xl p-6 h-[400px] shadow-lg shadow-[#0C2C54]/50">
            <h3 className="font-bold text-white mb-6">نمودار بازدید منطقه محمودآباد</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#a0b0c0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a0b0c0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#1E293B' }}
                  contentStyle={{ backgroundColor: '#030D1E', borderColor: '#D4AF37', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="views" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="leads" fill="#2ECC71" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Approval Queue */}
          <div className="bg-[#0C2C54] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                تأیید آگهی‌های در انتظار
                {pending.length > 0 && (
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold">
                    {pending.length}
                  </span>
                )}
              </h3>
              <button
                onClick={loadPending}
                disabled={loadingQueue}
                className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                title="بارگذاری مجدد"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingQueue ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 mb-2 text-green-500/50" />
                <p className="text-sm">هیچ آگهی در انتظار تأیید وجود ندارد</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 bg-[#1E293B]/50 border border-[#1E293B] hover:border-[#D4AF37]/20 rounded-xl p-4 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0C2C54] flex-shrink-0">
                      {listing.imageUrl
                        ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-600" /></div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">
                        {listing.location} · {listing.price}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        ثبت‌شده توسط: <span dir="ltr">{listing.advisorPhone || listing.phone}</span>
                      </p>
                    </div>

                    {/* Approve button */}
                    <button
                      onClick={() => listing.id && handleApprove(listing.id)}
                      disabled={approvingId === listing.id}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-600/40 hover:border-green-600 text-green-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {approvingId === listing.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle className="w-3.5 h-3.5" />
                      }
                      تأیید و انتشار
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: iOS Simulator */}
        <div className="flex flex-col items-center">
          <div className="bg-[#030D1E] w-full border border-[#D4AF37]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.05)]">
            <h3 className="font-bold text-white mb-2 text-center">فضای سندباکس PWA (iPhone 15 Pro Max Mockup)</h3>
            <p className="text-xs text-gray-400 text-center mb-6">تجربه نصب و اپلیکیشن اختصاصی ماهور در iOS بدون نیاز به اپ‌استور</p>
            <div className="flex justify-center flex-1">
              <IosSimulator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
