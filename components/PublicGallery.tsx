"use client";

// Swipeable image gallery for the public /p/[code] listing page.
// Images load through the /api/listing-image proxy (watermarked).
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FA = "۰۱۲۳۴۵۶۷۸۹";
const fa = (n: number) => String(n).replace(/\d/g, (d) => FA[+d]);

export default function PublicGallery({
  listingId,
  count,
  title,
}: {
  listingId: number;
  count: number;
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  if (count === 0) return null;

  const src = (i: number) => `/api/listing-image/${listingId}${i > 0 ? `?i=${i}` : ""}`;
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <div
      className="relative w-full mx-auto overflow-hidden select-none"
      style={{ aspectRatio: "3/2", maxWidth: 720 }}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (dx > 40) prev();       // swipe right (RTL: previous)
        else if (dx < -40) next(); // swipe left
        setTouchX(null);
      }}
    >
      <img
        src={src(index)}
        alt={title}
        className="w-full h-full object-cover object-center"
      />

      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="عکس قبلی"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="عکس بعدی"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Counter */}
          <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            {fa(index + 1)} / {fa(count)}
          </span>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`عکس ${fa(i + 1)}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "bg-[#D4AF37] w-5" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-8 left-0 right-0 hidden" />
        </>
      )}
    </div>
  );
}
