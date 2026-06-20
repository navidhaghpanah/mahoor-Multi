"use client";

import { ReactNode } from "react";
import { Home, PlusSquare, Share2, BarChart2, User, Sparkles } from "lucide-react";
import { motion } from "motion/react";

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
    // Analytics only for manager
    ...(user?.isManager ? [{ id: "analytics", label: "وب‌اپ و آمار", icon: BarChart2 }] : []),
    { id: "profile", label: "اشتراک و پروفایل", icon: User },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0F19] overflow-x-hidden md:pr-[250px] pb-[80px] md:pb-0">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] fixed top-0 bottom-0 right-0 border-l border-[#1E293B] bg-[#030D1E] p-6 z-40 shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/20">
            <Home className="text-[#D4AF37] w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-white">ماهور</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20" : "text-gray-400 hover:bg-[#1E293B] hover:text-white border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* AI Assistant Button */}
        <button 
          onClick={onOpenAi}
          className="mt-6 flex items-center justify-center gap-2 w-full bg-[#1E293B] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] py-3 rounded-xl transition-all group"
        >
          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
          <span className="font-medium text-sm">دستیار هوشمند AI</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#030D1E] border-t border-[#1E293B] flex items-center justify-around pb-safe pt-2 px-1 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-16 h-14 gap-1 rounded-xl relative"
            >
              {isActive && (
                <motion.div 
                  layoutId="mobileTabBubble"
                  className="absolute inset-0 bg-[#D4AF37]/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? "text-[#D4AF37]" : "text-gray-400"}`} />
              <span className={`text-[10px] relative z-10 font-bold ${isActive ? "text-[#D4AF37]" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      <button 
        onClick={onOpenAi}
        className="md:hidden fixed bottom-24 left-4 w-12 h-12 bg-[#D4AF37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center z-40 animate-bounce hover:animate-none"
      >
        <Sparkles className="w-6 h-6" />
      </button>

    </div>
  );
}
