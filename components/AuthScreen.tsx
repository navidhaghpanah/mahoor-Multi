"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, ArrowLeft, Loader2, Home } from "lucide-react";

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    let interval: any;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      setTimer(120);
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ورود پیامکی");
      
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min < 10 ? '۰' + min : min}:${sec < 10 ? '۰' + sec : sec}`;
  };

  return (
    <div className="min-h-[100dvh] bg-[#030D1E] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/5 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#D4AF37]/5 blur-[150px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="w-full max-w-sm z-10 flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-[#0C2C54] border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <Home className="w-10 h-10 text-[#D4AF37]" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">املاک ماهور</h1>
        <p className="text-[#a0b0c0] mb-10 text-center">ورود به پنل مشاورین شمال کشور</p>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.form 
              key="phone-form"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="w-full relative"
            >
              <div className="relative mb-6">
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="شماره موبایل (مثلا 09113276647)" 
                  className="w-full bg-[#0C2C54]/50 border border-[#1E293B] rounded-xl px-12 py-4 text-white text-left placeholder:text-right placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]/50"
                  dir="ltr"
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button 
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دریافت کد ورود"}
                {!loading && <ArrowLeft className="w-5 h-5" />}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-form"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerify}
              className="w-full relative"
            >
              <p className="text-sm text-[#a0b0c0] mb-4 text-center">کد ارسال شده به {phone} را وارد کنید</p>
              
              <div className="relative mb-6">
                <input 
                  type="text" 
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="-   -   -   -" 
                  className="w-full bg-[#0C2C54]/50 border border-[#1E293B] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[1em] focus:outline-none focus:border-[#D4AF37]"
                  dir="ltr"
                />
              </div>
              
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

              <button 
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-4 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تایید کد"}
              </button>
              
              <div className="flex justify-between mt-4">
                 <button type="button" onClick={() => setStep("phone")} className="text-sm text-gray-400 hover:text-white">ویرایش شماره</button>
                 <span className="text-sm text-[#D4AF37] font-mono">{formatTime(timer)}</span>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
