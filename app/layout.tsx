import type {Metadata, Viewport} from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';

const vazir = Vazirmatn({ 
  subsets: ['arabic', 'latin'], 
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mahoor Real Estate | املاک ماهور',
  description: 'Luxury Real Estate Management PWA for Northern Iran',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ماهور',
  },
  icons: {
    apple: '/icons/apple-icon-180.png',
  }
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
