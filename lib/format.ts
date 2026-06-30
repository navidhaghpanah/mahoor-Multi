// Shared display-formatting helpers — used by both client components and
// server-side caption builders (Telegram/Bale). Pure functions, no "use client".

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

function withThousandSeparators(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Price with thousand separators + "تومان" suffix, Persian digits. 0/empty → "توافقی".
export function formatPrice(n: number | string | null | undefined): string {
  const num = typeof n === 'string' ? parseInt(n.replace(/[^0-9]/g, ''), 10) : n;
  if (!num || num <= 0) return 'توافقی';
  return toPersianDigits(withThousandSeparators(num)) + ' تومان';
}

// Plain number with thousand separators + Persian digits (size, rooms, etc — no suffix).
export function formatNumber(n: number | string | null | undefined): string {
  const num = typeof n === 'string' ? parseInt(n.replace(/[^0-9]/g, ''), 10) : n;
  if (!num) return toPersianDigits('0');
  return toPersianDigits(withThousandSeparators(num));
}

// Short reference code derived from the DB id — stable, no extra column needed.
export function listingCode(id: number | string): string {
  return 'MH-' + toPersianDigits(String(id).padStart(4, '0'));
}
