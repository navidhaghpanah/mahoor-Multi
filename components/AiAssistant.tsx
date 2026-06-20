"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, X, Loader2 } from "lucide-react";

export function AiAssistant({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'سلام مشاور عزیز. من دستیار هوشمند شما در املاک ماهور هستم. چطور می‌توانم کمک کنم؟' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      // Send to gemini logic
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'متاسفانه در ارتباط با سرور مشکلی پیش آمد.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 md:bottom-24 left-4 md:left-8 w-[calc(100vw-32px)] md:w-[400px] h-[500px] bg-[#0C2C54]/95 backdrop-blur-xl border border-[#D4AF37]/50 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#030D1E] p-4 flex justify-between items-center border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                 <h3 className="text-white font-bold text-sm">دستیار هوش مصنوعی</h3>
                 <p className="text-[10px] text-[#D4AF37]">متصل به Gemini 1.5 Pro</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#1E293B] p-2 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-[#1E293B] text-white rounded-tr-sm border border-gray-700' 
                  : 'bg-gradient-to-br from-[#D4AF37]/20 to-[#B8962E]/10 text-white rounded-tl-sm border border-[#D4AF37]/30'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#D4AF37]/20 p-4 rounded-2xl rounded-tl-sm border border-[#D4AF37]/30">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#030D1E] border-t border-[#1E293B]">
             <form onSubmit={handleSend} className="relative">
               <input 
                 autoFocus
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="سوال خود را درباره املاک بپرسید..." 
                 className="w-full bg-[#0C2C54] border border-[#1E293B] text-white text-sm rounded-xl px-4 py-4 pr-12 focus:outline-none focus:border-[#D4AF37]"
               />
               <button 
                 type="submit"
                 disabled={!input.trim() || loading}
                 className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#D4AF37] hover:bg-[#B8962E] text-black rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
               >
                 <Send className="w-4 h-4 ml-1" />
               </button>
             </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
