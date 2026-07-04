'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export default function ShareButtons({ url, title, description = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `${title}\n\n${description}\n\n${url}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleInstagram = async () => {
    const caption = `🏠 ${title}\n\n${description}\n\n📍 املاک ماهور\n🔗 ${url}\n\n#املاک_ماهور #شمال_ایران #خرید_ملک`;
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 border-t border-zinc-800 pt-6">
      <p className="text-sm text-zinc-400 mb-4">اشتراک‌گذاری آگهی</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleNativeShare} className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all">📤 اشتراک‌گذاری</button>
        <button onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#1EBE5A] active:bg-[#17A04A] text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all">💬 واتساپ</button>
        <button onClick={handleInstagram} className="bg-gradient-to-r from-[#E1306C] to-[#C13584] hover:brightness-110 active:brightness-90 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all">{copied ? '✅ کپی شد!' : '📸 اینستاگرام'}</button>
        <button onClick={handleCopyLink} className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all">{copied ? '✅ کپی شد!' : '🔗 کپی لینک'}</button>
      </div>
    </div>
  );
}
