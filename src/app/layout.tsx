import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

const SITE_NAME = "Law is our playground - Legal Sandbox Georgia";
const SITE_URL = "https://www.legal.ge";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body suppressHydrationWarning className={`${geistSans.className} ${geistMono.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
