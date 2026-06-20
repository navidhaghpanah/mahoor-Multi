"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from "recharts";
import { IosSimulator } from "./IosSimulator";
import { CheckCircle } from "lucide-react";

const data = [
  { name: 'شنبه', views: 400, leads: 24 },
  { name: 'یک‌شنبه', views: 300, leads: 13 },
  { name: 'دوشنبه', views: 200, leads: 98 },
  { name: 'سه‌شنبه', views: 270, leads: 39 },
  { name: 'چهارشنبه', views: 180, leads: 48 },
  { name: 'پنج‌شنبه', views: 230, leads: 38 },
  { name: 'جمعه', views: 340, leads: 43 },
];

export function TabAnalytics() {
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
              <span className="text-xs text-[#2ECC71] mt-2 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> +۱۴٪ نسبت به هفته قبل</span>
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
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#a0b0c0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a0b0c0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1E293B'}}
                  contentStyle={{ backgroundColor: '#030D1E', borderColor: '#D4AF37', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="views" fill="#D4AF37" radius={[4,4,0,0]} barSize={20} />
                <Bar dataKey="leads" fill="#2ECC71" radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-[#0C2C54] border border-[#1E293B] rounded-2xl p-6">
             <h3 className="font-bold text-white mb-2">تایید آگهی‌های در انتظار (Approval)</h3>
             <div className="flex items-center justify-between p-4 bg-[#1E293B]/50 rounded-xl mt-4">
                <div>
                   <h4 className="font-bold text-sm text-[#D4AF37]">پنت‌هاوس ساحلی (توسط خانم حیدری)</h4>
                   <p className="text-xs text-gray-400">ثبت شده در ۲ ساعت پیش</p>
                </div>
                <button className="bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/50 px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#2ECC71] hover:text-black transition-colors">
                   تایید و انتشار
                </button>
             </div>
          </div>
        </div>

        {/* Right Side: iOS Simulator Box */}
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
