"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

type Step = "phone" | "otp" | "pin" | "setup_pin";

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [phone, setPhone]         = useState("");
  const [step, setStep]           = useState<Step>("phone");
  const [otp, setOtp]             = useState("");
  const [pin, setPin]             = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [otpToken, setOtpToken]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [timer, setTimer]         = useState(120);

  useEffect(() => {
    let interval: any;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60), s = t % 60;
    return `${m < 10 ? "۰" + m : m}:${s < 10 ? "۰" + s : s}`;
  };

  // ── Step 1: submit phone ─────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ارسال کد");
      if (data.hasPIN) {
        setStep("pin");
      } else {
        setOtpToken(data.token);
        setOtp(""); setStep("otp"); setTimer(120);
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Step 2a: verify OTP ──────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpToken, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در تایید کد");
      if (data.needsPinSetup) {
        setPin(""); setPinConfirm(""); setStep("setup_pin");
      } else {
        onLogin(data.user);
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Step 2b: verify PIN ──────────────────────────────────────────────────────
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/verify-pin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PIN نادرست است");
      onLogin(data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Step 3: set PIN (first time) ─────────────────────────────────────────────
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN باید ۴ رقم عددی باشد"); return;
    }
    if (pin !== pinConfirm) {
      setError("تکرار PIN مطابقت ندارد"); return;
    }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/set-pin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin, otpToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ذخیره PIN");
      onLogin(data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = "w-full bg-[#0C2C54]/50 border border-[#1E293B] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[1em] focus:outline-none focus:border-[#D4AF37]";

  return (
    <div className="min-h-[100dvh] bg-[#030D1E] flex flex-col items-center justify-center relative overflow-hidden px-6 pb-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#D4AF37]/5 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="w-full max-w-sm z-10 flex flex-col items-center"
      >
        <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 mb-6 shadow-[0_0_40px_rgba(212,175,55,0.15)] bg-[#0C2C54]">
          <Image src="/logo.jpg" alt="لوگو ماهور" width={112} height={112} className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">املاک ماهور</h1>
        <p className="text-[#D4AF37] text-sm font-medium mb-2">MAHOOR REAL ESTATE</p>
        <p className="text-[#a0b0c0] mb-10 text-center text-sm">ورود به پنل مشاورین شمال کشور</p>

        <AnimatePresence mode="wait">
          {/* ── Phone entry ── */}
          {step === "phone" && (
            <motion.form key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp} className="w-full"
            >
              <div className="relative mb-6">
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="شماره موبایل (مثلا 09121234567)"
                  className="w-full bg-[#0C2C54]/50 border border-[#1E293B] rounded-xl px-12 py-4 text-white text-left placeholder:text-right placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]/50"
                  dir="ltr"
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button type="submit" disabled={loading || phone.length < 10}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ادامه"}
                {!loading && <ArrowLeft className="w-5 h-5" />}
              </button>
            </motion.form>
          )}

          {/* ── OTP entry ── */}
          {step === "otp" && (
            <motion.form key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerify} className="w-full"
            >
              <p className="text-sm text-[#a0b0c0] mb-4 text-center">کد ارسال شده به {phone} را وارد کنید</p>
              <div className="relative mb-4">
                <input type="text" inputMode="numeric" maxLength={4} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="- - - -"
                  className={inp} dir="ltr" autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button type="submit" disabled={loading || otp.length < 4}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-4 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تایید کد"}
              </button>
              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => { setStep("phone"); setError(""); }}
                  className="text-sm text-gray-400 hover:text-white">ویرایش شماره</button>
                <span className="text-sm text-[#D4AF37] font-mono">{formatTime(timer)}</span>
              </div>
            </motion.form>
          )}

          {/* ── PIN entry (returning users) ── */}
          {step === "pin" && (
            <motion.form key="pin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyPin} className="w-full"
            >
              <div className="flex items-center justify-center gap-2 mb-4 text-[#D4AF37]">
                <Lock className="w-5 h-5" />
                <p className="text-sm text-[#a0b0c0] text-center">کد PIN خود را وارد کنید</p>
              </div>
              <div className="relative mb-4">
                <input type="password" inputMode="numeric" maxLength={4} value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • •"
                  className={inp} dir="ltr" autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button type="submit" disabled={loading || pin.length < 4}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-4 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ورود"}
              </button>
              <button type="button" onClick={() => { setPin(""); setStep("phone"); setError(""); }}
                className="w-full text-center text-sm text-gray-400 hover:text-white mt-4">
                ← تغییر شماره
              </button>
            </motion.form>
          )}

          {/* ── PIN setup (first login) ── */}
          {step === "setup_pin" && (
            <motion.form key="setup_pin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSetPin} className="w-full"
            >
              <div className="flex items-center justify-center gap-2 mb-2 text-[#D4AF37]">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-semibold">تنظیم کد PIN</span>
              </div>
              <p className="text-xs text-[#a0b0c0] text-center mb-5">
                برای ورودهای بعدی یک کد ۴ رقمی انتخاب کنید
              </p>
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1 text-center">PIN جدید</p>
                  <input type="password" inputMode="numeric" maxLength={4} value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • •"
                    className={inp} dir="ltr" autoFocus
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1 text-center">تکرار PIN</p>
                  <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm}
                    onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • •"
                    className={inp} dir="ltr"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button type="submit" disabled={loading || pin.length < 4 || pinConfirm.length < 4}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-4 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ثبت PIN و ورود"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-700 tracking-widest font-semibold select-none z-10">NH</p>
    </div>
  );
}
