import type {Metadata, Viewport} from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';

const vazir = Vazirmatn({ 
  subsets: ['arabic', 'latin'], 
  variable: '--font-sans',
  display: 'swap',
});

const APP_URL = 'https://app.mahoorrlste.ir';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'مجموعه تخصصی املاک ماهور | خرید، فروش و اجاره ملک',
    template: '%s | ماهور',
  },
  description: 'مجموعه تخصصی املاک ماهور — خرید، فروش، رهن و اجاره آپارتمان، ویلا، زمین و املاک تجاری در شمال ایران.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ماهور',
  },
  icons: {
    apple: '/icons/apple-icon-180.png',
  },
  openGraph: {
    title: 'مجموعه تخصصی املاک ماهور',
    description: 'خرید، فروش، رهن و اجاره آپارتمان، ویلا، زمین و املاک تجاری در شمال ایران.',
    url: APP_URL,
    siteName: 'مجموعه تخصصی املاک ماهور',
    locale: 'fa_IR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0F19',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} dark`}>
      <body className="font-sans bg-[#0B0F19] text-white antialiased selection:bg-[#D4AF37] selection:text-black overflow-x-hidden min-h-[100dvh]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
