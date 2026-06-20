"use client";
import { LogOut, Star } from "lucide-react";

export function TabProfile({ user, onLogout }: { user: any, onLogout: () => void }) {
  const toPersian = (num: number) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d as any]);
  };

  return (
    <div className="max-w-3xl flex flex-col gap-6 mx-auto w-full">
      <div className="bg-[#0C2C54] border border-[#1E293B] p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-full -z-0"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 z-10 relative">
          <div className="w-24 h-24 rounded-2xl border-2 border-[#D4AF37] p-1 flex-shrink-0">
            <img src="https://picsum.photos/seed/profile/200/200" alt="Profile" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div className="text-center md:text-right">
            <h2 className="text-2xl font-bold text-white mb-1">{user?.fullName}</h2>
            <p className="text-[#a0b0c0] text-sm mb-1">{user?.agencyName}</p>
            <p className="text-[#a0b0c0] text-sm">شماره پروانه: {user?.licenseNumber}</p>
            <p className="text-[#a0b0c0] text-sm mt-2">{user?.agencyAddress}</p>
            <div className="mt-3 justify-center md:justify-start flex gap-2">
               <span className="bg-[#1E293B] border border-[#1E293B] text-gray-300 px-3 py-1 rounded-full text-xs">{user?.isManager ? 'مدیر ارشد' : 'مشاور'}</span>
               <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold">{toPersian(user?.phoneNumber || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#0C2C54] to-[#030D1E] border border-[#D4AF37]/40 p-1 md:p-[2px] rounded-3xl mt-4 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative group">
        <div className="bg-[#030D1E] rounded-[22px] p-6 text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-[#D4AF37]/20 flex items-center justify-center rounded-full text-[#D4AF37] group-hover:scale-110 transition-transform">
              <Star className="w-8 h-8 fill-[#D4AF37]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#D4AF37]">{user?.currentPlan}</h2>
          <p className="text-sm text-gray-400">انقضا: {user?.planExpiryDate}</p>
          
          <div className="flex flex-col gap-3 py-4 max-w-sm mx-auto">
            <div className="flex justify-between items-center text-sm border-b border-[#1E293B] pb-2">
              <span className="text-gray-400">سقف آگهی مجاز</span>
              <span className="text-white font-bold">{toPersian(user?.adsLimitRemaining || 0)} از {toPersian(user?.totalAdsAllowed || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-[#1E293B] pb-2">
              <span className="text-gray-400">اعتبار همگام‌سازی</span>
              <span className="text-white font-bold">{toPersian(user?.directSyncLimitRemaining || 0)} از {toPersian(user?.totalDirectSyncLimit || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">دستیار هوش مصنوعی</span>
              <span className="text-[#D4AF37] font-bold">{user?.isManager ? 'نامحدود (پلاتینیوم)' : 'فعال'}</span>
            </div>
          </div>

          <button className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-3 px-8 rounded-xl transition-all shadow-xl mt-2 w-full md:w-auto">
            ارتباط با پشتیبانی / ارتقا
          </button>
        </div>
      </div>

      <div className="max-w-3xl flex justify-center mt-6">
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-6 py-3 rounded-xl transition-colors font-bold w-full md:w-auto justify-center"
        >
          <LogOut className="w-5 h-5" />
          خروج از پنل
        </button>
      </div>

    </div>
  );
}
