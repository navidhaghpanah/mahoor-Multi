"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Battery, Wifi, Signal, Share, Square, PlusSquare, ArrowLeft } from "lucide-react";

export function IosSimulator() {
  const [screen, setScreen] = useState<"home" | "safari" | "pwa">("safari");
  
  const time = "۹:۴۱";

  return (
    <div className="w-[380px] h-[780px] bg-black rounded-[55px] border-[12px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col scale-90 sm:scale-100 origin-top">
      {/* Dynamic Island Mock */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-[20px] z-50 flex items-center justify-between px-3">
         <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
         <div className="w-5 h-5 bg-gray-900/50 rounded-full border border-gray-800"></div>
      </div>

      {/* Top Status Bar */}
      <div className="h-12 w-full flex items-center justify-between px-6 pt-3 z-40 text-white relative pointer-events-none">
         <span className="text-sm font-semibold">{time}</span>
         <div className="flex items-center gap-1.5">
           <Signal className="w-4 h-4 fill-white" />
           <Wifi className="w-4 h-4" />
           <Battery className="w-[22px] h-[22px]" />
         </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === "safari" && (
          <motion.div key="safari" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#F1F3F4] flex flex-col relative w-full h-full pb-safe">
             {/* Safari URL Bar Area */}
             <div className="bg-[#1E293B] pt-4 pb-2 px-4 shadow-sm z-30 relative top-6 rounded-b-3xl">
                <div className="bg-[#2A3B54] text-white/80 p-3 rounded-xl flex items-center justify-center gap-2 text-sm max-w-[90%] mx-auto shadow-inner">
                  <span className="font-mono">mahoorrlste.ir</span>
                </div>
             </div>
             
             {/* Web Content Mock */}
             <div className="flex-1 bg-[#0B0F19] p-6 pt-16 text-center text-white flex flex-col items-center">
                <div className="w-20 h-20 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-2xl flex items-center justify-center mb-6">
                   <h1 className="text-2xl font-bold text-[#D4AF37]">M</h1>
                </div>
                <h2 className="text-xl font-bold mb-2">وب‌اپلیکیشن ماهور</h2>
                <p className="text-gray-400 text-sm">ارائه خدمات مسکن لوکس منطقه محمودآباد</p>
                
                <div className="mt-auto mb-10 text-xs text-[#D4AF37] border border-[#D4AF37] p-3 rounded-xl bg-[#D4AF37]/10 animate-pulse cursor-pointer" onClick={() => setScreen("home")}>
                   (شبیه‌سازی: ارسال به صفحه اصلی)
                </div>
             </div>

             {/* Safari Bottom Bar */}
             <div className="h-[80px] bg-[#1E293B] border-t border-gray-800 flex justify-around items-center pb-2 px-4 border-b-8 border-b-black">
                <ArrowLeft className="text-[#a0b0c0] w-6 h-6" />
                <ArrowLeft className="text-[#a0b0c0] w-6 h-6 rotate-180 opacity-50" />
                <button onClick={() => setScreen("home")} className="text-blue-400 relative">
                  <Share className="w-6 h-6" />
                  <motion.div initial={{ y: -5, opacity: 0.8 }} animate={{ y: 5, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] shadow border border-blue-600">!</motion.div>
                </button>
                <div className="w-6 h-6 border-2 border-[#a0b0c0] rounded"></div>
                <Square className="text-[#a0b0c0] w-6 h-6" />
             </div>
          </motion.div>
        )}

        {screen === "home" && (
          <motion.div key="home" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} className="flex-1 bg-gradient-to-b from-blue-900 to-black flex relative w-full h-full pt-16 p-6">
             <div className="grid grid-cols-4 gap-4 w-full content-start">
               {/* iOS App Icons */}
               <div className="flex flex-col items-center gap-1">
                 <div className="w-[60px] h-[60px] bg-green-500 rounded-2xl"></div>
                 <span className="text-white text-[11px]">Phone</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <div className="w-[60px] h-[60px] bg-blue-500 rounded-2xl"></div>
                 <span className="text-white text-[11px]">Mail</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <div className="w-[60px] h-[60px] bg-white rounded-2xl"></div>
                 <span className="text-white text-[11px]">Safari</span>
               </div>
               
               {/* PWA Saved Icon */}
               <button onClick={() => setScreen("pwa")} className="flex flex-col items-center gap-1 group">
                 <div className="w-[60px] h-[60px] bg-[#0C2C54] rounded-2xl border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:scale-95 transition-transform relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-8 h-8 bg-[#D4AF37]/30 rounded-bl-full"></div>
                   <span className="text-2xl font-bold text-[#D4AF37]">M</span>
                 </div>
                 <span className="text-white text-[11px] font-bold">ماهور</span>
               </button>
             </div>

             <div className="absolute bottom-6 left-4 right-4 h-20 bg-white/20 backdrop-blur-xl rounded-[30px] flex justify-around items-center px-4">
                 <div className="w-[60px] h-[60px] bg-green-400 rounded-2xl"></div>
                 <div className="w-[60px] h-[60px] bg-blue-400 rounded-2xl"></div>
                 <div className="w-[60px] h-[60px] bg-orange-400 rounded-2xl"></div>
                 <div className="w-[60px] h-[60px] bg-red-400 rounded-2xl"></div>
             </div>
          </motion.div>
        )}

        {screen === "pwa" && (
          <motion.div key="pwa" initial={{ y: 50, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="flex-1 bg-[#0B0F19] text-white flex flex-col relative w-full h-full pt-16">
             {/* Standalone mode - NO URL bar */}
             <div className="px-6 pb-2 border-b border-[#1E293B]">
                <h2 className="font-bold text-xl text-white">آگهی‌های اخیر</h2>
             </div>
             
             <div className="flex-1 p-6 space-y-4 overflow-hidden">
                <div className="bg-[#0C2C54]/50 border border-[#1E293B] p-4 rounded-2xl">
                   <div className="w-full h-[120px] bg-gray-800 rounded-xl mb-3"></div>
                   <h3 className="font-bold text-sm">ویلای ساحلی خزرشهر</h3>
                   <span className="text-[#D4AF37] font-bold text-xs mt-1 block">۷۵ میلیارد تومان</span>
                </div>
                <div className="bg-[#0C2C54]/50 border border-[#1E293B] p-4 rounded-2xl">
                   <div className="w-full h-[120px] bg-gray-800 rounded-xl mb-3"></div>
                   <h3 className="font-bold text-sm">آپارتمان نوساز معلم</h3>
                   <span className="text-[#D4AF37] font-bold text-xs mt-1 block">۱۲ میلیارد تومان</span>
                </div>
             </div>

             {/* PWA Bottom Nav Mockup */}
             <div className="h-[80px] bg-[#030D1E] border-t border-[#1E293B] flex justify-around items-start pt-3 pb-safe px-4 z-40 border-b-8 border-b-black mt-auto">
                <div className="flex flex-col items-center gap-1 text-[#D4AF37]">
                  <Square className="w-6 h-6 fill-[#D4AF37]" />
                  <span className="text-[10px]">خانه</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <PlusSquare className="w-6 h-6" />
                  <span className="text-[10px]">ثبت</span>
                </div>
                <button onClick={() => setScreen("safari")} className="flex flex-col items-center gap-1 text-red-500 mt-1">
                  <span className="text-xs font-bold bg-red-500/20 px-3 py-1 rounded-full">خروج (Reset)</span>
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iPhone Home Indicator Line */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-white rounded-full z-50"></div>
    </div>
  );
}
