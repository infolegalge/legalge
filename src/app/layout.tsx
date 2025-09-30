import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_NAME = "Law is our playground - Legal Sandbox Georgia";
const SITE_URL = "https://www.legal.ge";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Innovating legal services in Georgia",
  openGraph: {
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: "Legal.ge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeInit = `(() => {
    try {
      const fromCookie = (document.cookie.match(/(?:^|; )theme=([^;]+)/)?.[1] || '').trim();
      const saved = fromCookie || localStorage.getItem('theme') || 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = saved === 'dark' || (saved === 'system' && prefersDark);
      const root = document.documentElement;
      if (dark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    } catch {}
  })();`;
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          key="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
