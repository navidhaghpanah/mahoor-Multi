// Public, server-rendered detail page for a single listing.
// URL: /p/MH-0014  (ASCII code)  or  /p/14  (numeric id fallback)
// Renders full Open Graph + Twitter meta tags so Telegram/WhatsApp show preview cards.

import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { db } from '../../../src/db/index';
import { realEstateAds, users } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';
import {
  formatPrice,
  formatNumber,
  toPersianDigits,
  listingCode,
} from '../../../lib/format';
import ShareButtons from '@/components/ShareButtons';
import PublicGallery from '@/components/PublicGallery';

const APP_URL = 'https://app.mahoorrlste.ir';

// Accept MH-0014, MH-۰۰۱۴ (Persian digits), or a bare numeric id.
function codeToId(raw: string): number | null {
  const mhMatch = raw.trim().match(/^[Mm][Hh]-(.+)$/);
  if (mhMatch) {
    const digits = mhMatch[1].replace(
      /[۰-۹]/g,
      (d) => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x30)
    );
    const n = parseInt(digits, 10);
    return n > 0 ? n : null;
  }
  const n = parseInt(raw.trim(), 10);
  return n > 0 ? n : null;
}

// Canonical ASCII slug for URLs (e.g. MH-0014 — no Persian digits).
function listingSlug(id: number): string {
  return 'MH-' + String(id).padStart(4, '0');
}

// Deduplicate the DB query shared between generateMetadata and the page.
const fetchRow = cache(async (id: number) => {
  const rows = await db
    .select()
    .from(realEstateAds)
    .leftJoin(users, eq(realEstateAds.advisorId, users.id))
    .where(eq(realEstateAds.id, id));
  return rows[0] ?? null;
});

function parseImages(ad: { images: string | null; imageUrl: string | null }): string[] {
  let imgs: string[] = [];
  if (ad.images) { try { imgs = JSON.parse(ad.images); } catch {} }
  if (!imgs.length && ad.imageUrl) imgs = [ad.imageUrl];
  return imgs;
}

function cleanDesc(raw: string): string {
  return (raw ?? '')
    .replace(/\s*\|\s*تماس:[^|]*/g, '')
    .replace(/\s*\|\s*منبع:[^|]*/g, '')
    .replace(/تماس:[^|]*/g, '')
    .trim()
    .replace(/^\|/, '')
    .trim();
}

function toIntlPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('98')) return d;
  return '98' + (d.startsWith('0') ? d.slice(1) : d);
}

const DEAL_LABELS: Record<string, string> = {
  sale: 'فروش',       فروش: 'فروش',
  rent: 'اجاره',      اجاره: 'اجاره',
  mortgage: 'رهن',    'رهن کامل': 'رهن کامل',   'رهن و اجاره': 'رهن و اجاره',
  presale: 'پیش‌فروش', 'پیش‌فروش': 'پیش‌فروش',
  'daily-rent': 'اجاره شبانه', 'اجاره شبانه': 'اجاره شبانه',
};

// ── Metadata (OG + Twitter) ────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const id = codeToId(code);
  if (!id) return {};

  const row = await fetchRow(id);
  if (!row?.real_estate_ads.isManagerApproved) return {};

  const ad   = row.real_estate_ads;
  const imgs = parseImages(ad);
  const slug = listingSlug(ad.id);
  const url  = `${APP_URL}/p/${slug}`;
  const desc = `${ad.type} در ${ad.location ?? ''} — ${formatPrice(ad.price)}`;
  const ogImg = imgs.length ? `${APP_URL}/api/listing-image/${ad.id}` : undefined;

  return {
    title:       `${ad.title} | ماهور`,
    description: desc,
    openGraph: {
      title:       ad.title,
      description: desc,
      url,
      siteName:    'مجموعه تخصصی املاک ماهور',
      locale:      'fa_IR',
      type:        'website',
      images:      ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: ad.title }] : [],
    },
    twitter: {
      card:        'summary_large_image',
      title:       ad.title,
      description: desc,
      images:      ogImg ? [ogImg] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function ListingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const id = codeToId(code);
  if (!id) notFound();

  const row = await fetchRow(id!);
  if (!row?.real_estate_ads.isManagerApproved) notFound();

  const ad     = row.real_estate_ads;
  const advisor = row.users;
  const imgs   = parseImages(ad);
  const desc   = cleanDesc(ad.description);

  const advisorPhone = advisor?.phoneNumber ?? '';
  const advisorName  = advisor?.fullName ?? 'مشاور ماهور';
  const intlPhone    = advisorPhone ? toIntlPhone(advisorPhone) : '';
  const waText       = encodeURIComponent(`${ad.title}\n${formatPrice(ad.price)}\n📍 ${ad.location ?? ''}\n🔗 ${APP_URL}/p/${listingSlug(ad.id)}`);
  const waUrl        = intlPhone ? `https://wa.me/${intlPhone}?text=${waText}` : '';

  const dealLabel = DEAL_LABELS[ad.type] ?? ad.type;
  const displayCode = listingCode(ad.id); // Persian digits for display

  return (
    <div className="min-h-screen bg-[#030D1E] text-white">

      {/* Swipeable gallery — arrows / dots / swipe, all photos via watermark proxy */}
      <PublicGallery listingId={ad.id} count={imgs.length} title={ad.title} />

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Title */}
        <h1 className="text-xl font-bold leading-snug mb-5">{ad.title}</h1>

        {/* Details — fixed order: کد، نوع، زمین، بنا، خواب، مدارک، موقعیت، قیمت، مشاور */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
          {([
            ['کد',      displayCode],
            ['نوع',     dealLabel],
            ['زمین',    ad.areaSize > 0 ? `${formatNumber(ad.areaSize)} متر` : ''],
            ['بنا',     ad.buildingArea && ad.buildingArea > 0 ? `${formatNumber(ad.buildingArea)} متر` : ''],
            ['خواب',    ad.rooms > 0 ? toPersianDigits(ad.rooms) : ''],
            ['مدارک',   ad.documents ?? ''],
            ['موقعیت',  ad.location ?? ''],
            ['قیمت',    formatPrice(ad.price)],
            ['مشاور',   advisorName],
          ] as [string, string][]).filter(([, v]) => v).map(([label, value], i, arr) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-3 text-sm ${i < arr.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
            >
              <span className="text-[#a0b0c0]">{label}</span>
              <span className={`font-semibold text-left ${label === 'قیمت' ? 'text-[#D4AF37] text-base' : 'text-white'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        {desc && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 mb-6">
            <p className="text-[#c0cfd8] text-sm leading-loose whitespace-pre-wrap">{desc}</p>
          </div>
        )}

        {/* Advisor contact card */}
        <div className="bg-[#0C2C54] border border-[#D4AF37]/25 rounded-2xl p-5 mb-6">
          <p className="text-[#a0b0c0] text-xs mb-1">مشاور ملکی</p>
          <p className="font-bold text-lg mb-4">{advisorName}</p>
          {advisorPhone && (
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${advisorPhone}`}
                className="block text-center bg-[#D4AF37] text-[#030D1E] py-3 rounded-xl font-bold text-sm"
              >
                📞 تماس: {toPersianDigits(advisorPhone)}
              </a>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm"
                >
                  💬 ارسال پیام واتساپ
                </a>
              )}
            </div>
          )}
        </div>

        {/* Share buttons */}
        <ShareButtons
          url={`${APP_URL}/p/${listingSlug(ad.id)}`}
          title={ad.title}
          description={desc}
        />

        {/* Office location — Neshan map */}
        <div className="mt-8 bg-[#0C2C54] border border-[#1E293B] rounded-2xl overflow-hidden">
          <p className="text-sm font-bold px-4 pt-4 pb-2">📍 موقعیت دفتر املاک ماهور</p>
          <iframe
            title="نقشه دفتر املاک ماهور"
            src="https://neshan.org/maps/iframe/places/e6b2021f031276677ff2932eb5210ea0#c36.609-52.274-15z-0p/36.608712415328405/52.26866934659323"
            className="w-full border-0"
            style={{ height: 260 }}
            allowFullScreen
            loading="lazy"
          />
          <a
            href="https://nshn.ir/e6_bfscK2FHD8-"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border-t border-[#D4AF37]/20 text-[#D4AF37] py-3 text-sm font-bold transition-colors"
          >
            🧭 مسیریابی با نشان
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-[#4a6070] text-xs mt-8">
          <a href={APP_URL} className="text-[#D4AF37] hover:underline">
            مجموعه تخصصی املاک ماهور
          </a>
          {' · '}
          <span>۰۱۱-۴۴۷۳-۵۳۳۳</span>
        </p>
      </div>
    </div>
  );
}
