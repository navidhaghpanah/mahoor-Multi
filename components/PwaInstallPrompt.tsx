"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";

export function PwaInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect if already installed / standalone mode
    const isStandaloneMode = 
      ("standalone" in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    
    setIsStandalone(isStandaloneMode);

    // Only show prompt on iOS if not standalone
    if (isIOSDevice && !isStandaloneMode) {
      // Optional: Check localstorage to not bother users constantly
      const hasDismissed = localStorage.getItem("mahoor_pwa_dismissed");
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("mahoor_pwa_dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 px-4 md:hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-surface-light border border-gold/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative">
        <button 
          onClick={dismiss}
          className="absolute top-3 left-3 text-text-secondary hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-right pl-6">
          <h3 className="font-bold text-base text-gold mb-1">نسخه وب‌اپلیکیشن ماهور</h3>
          <p className="text-xs text-text-secondary">
            برای تجربه روان‌تر و بهتر (مانند یک اپلیکیشن بومی)، ماهور را به صفحه اصلی خود اضافه کنید.
          </p>
        </div>

        <div className="bg-canvas/50 rounded-xl p-3 flex flex-col gap-2 text-xs text-text-primary text-right mt-1">
          <div className="flex items-center justify-end gap-2">
            <span>در نوار پایین صفحه، دکمه اشتراک‌گذاری را لمس کنید</span>
            <Share className="w-4 h-4 text-gold mb-1" />
            <span className="font-bold flex-shrink-0 bg-surface px-2 py-0.5 rounded-full text-[10px]">مرحله ۱</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>گزینه <span className="font-semibold px-1">Add to Home Screen</span> را انتخاب کنید</span>
            <PlusSquare className="w-4 h-4 text-gold" />
            <span className="font-bold flex-shrink-0 bg-surface px-2 py-0.5 rounded-full text-[10px]">مرحله ۲</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>در بالا گزینه <span className="font-semibold px-1">Add</span> را لمس کنید</span>
            <span className="font-bold flex-shrink-0 bg-surface px-2 py-0.5 rounded-full text-[10px]">مرحله ۳</span>
          </div>
        </div>
      </div>
    </div>
  );
}
