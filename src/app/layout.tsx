import type { Metadata, Viewport } from 'next';
import { Raleway, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/content';

const display = Raleway({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-raleway',
  display: 'swap',
});

const body = Source_Sans_3({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-source',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Тест на притяжение в общении — что в твоей речи отталкивает людей',
  description:
    '10 вопросов о стиле общения — и честный разбор что в твоей речи притягивает а что отталкивает. Бесплатный результат с рекомендациями.',
  keywords: [
    'тест на притяжение',
    'что отталкивает в общении',
    'коммуникационная харизма',
    'стиль общения тест',
    'притяжение в разговоре',
    'как говорить чтобы нравиться тест',
    'речевое притяжение',
  ],
  authors: [{ name: 'Евдокимов Даниил Владимирович' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: SITE.name,
    title: 'Что в твоей речи притягивает — а что отталкивает',
    description: '10 вопросов о стиле общения и честный разбор вашей коммуникации.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Что в твоей речи притягивает — а что отталкивает',
    description: '10 вопросов о стиле общения и честный разбор вашей коммуникации.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon-32x32.png',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0A0806',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
