"use client";

import { ReactNode } from "react";
import { Home, PlusSquare, Share2, BarChart2, User, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

interface AppShellProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onOpenAi: () => void;
  user: any;
}

export function AppShell({ children, activeTab, onTabChange, onOpenAi, user }: AppShellProps) {
  const tabs = [
    { id: "listings", label: "آگهی‌ها", icon: Home },
    { id: "add", label: "ثبت آگهی", icon: PlusSquare },
    { id: "channels", label: "درگاه‌ها", icon: Share2 },
    ...(user?.isManager ? [
      { id: "analytics", label: "آمار و تحلیل", icon: BarChart2 },
      { id: "admin", label: "مدیریت آگهی", icon: ShieldCheck },
    ] : []),
    { id: "profile", label: "پروفایل", icon: User },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#030D1E] overflow-x-hidden md:pr-[260px] pb-[80px] md:pb-0">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] fixed top-0 bottom-0 right-0 border-l border-[#1E293B] bg-[#020B17] z-40 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {/* Logo */}
        <div className="p-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/20 flex-shrink-0 bg-[#0C2C54]">
              <Image
                src="/logo.jpg"
                alt="لوگو ماهور"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">املاک ماهور</h1>
              <p className="text-[10px] text-[#D4AF37]">مشاورین اmlاک و سرمایه‌گذاری</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right ${
                  isActive
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]"
                    : "text-gray-400 hover:bg-[#1E293B] hover:text-white border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{tab.label}</span>
                {isActive && (
                  <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Assistant Button */}
        <div className="p-4 border-t border-[#1E293B]">
          <button
            onClick={onOpenAi}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] py-3 rounded-xl transition-all group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            <span className="font-medium text-sm">دستیار هوشمند AI</span>
          </button>
          <p className="text-center text-[10px] text-gray-600 mt-3">
            &copy; {new Date().getFullYear()} &mdash; mahoorrlste.ir
          </p>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#020B17]/95 backdrop-blur-sm border-b border-[#1E293B] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#D4AF37]/20 flex-shrink-0 bg-[#0C2C54]">
            <Image src="/logo.jpg" alt="ماهور" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">املاک ماهور</h1>
            <p className="text-[9px] text-[#D4AF37]">محمودآباد</p>
          </div>
        </div>
        <button
          onClick={onOpenAi}
          className="w-9 h-9 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020B17] border-t border-[#1E293B] flex items-center justify-around pb-safe pt-2 px-1 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center min-w-[56px] h-14 gap-1 rounded-xl relative px-1"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileTabBubble"
                  className="absolute inset-0 bg-[#D4AF37]/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-[#D4AF37]" : "text-gray-500"
                }`}
              />
              <span
                className={`text-[9px] relative z-10 font-semibold transition-colors ${
                  isActive ? "text-[#D4AF37]" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
