import { DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSiteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/tools-catalog";

const dmSans = DM_Sans({ subsets: ["latin"] });

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || null;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || null;
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || null;
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || null; // e.g. "ca-pub-1234567890123456"

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    'Free, fast, accurate SEO tools — sitemap checker, robots tester, on-page audit, ' +
    'schema validator, redirect tracer, page speed and more. No sign-up required.',
  applicationName: SITE_NAME,
  keywords: [
    'SEO tools', 'sitemap checker', 'robots.txt tester', 'on-page SEO audit',
    'schema validator', 'meta tag checker', 'open graph checker', 'redirect checker',
    'broken link checker', 'page speed', 'gzip checker', 'SSL checker', 'WHOIS', 'DNS lookup',
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: 'A complete suite of SEO and webmaster tools that run in your browser.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: 'A complete suite of SEO and webmaster tools that run in your browser.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // Site-verification meta tags. Each is omitted when its env var is not set.
  verification: {
    google: googleVerification || undefined,
    other: {
      ...(bingVerification ? { 'msvalidate.01': bingVerification } : {}),
      ...(yandexVerification ? { 'yandex-verification': yandexVerification } : {}),
      // Google AdSense site-association tag.
      ...(adsenseClient ? { 'google-adsense-account': adsenseClient } : {}),
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={dmSans.className}>
      <body suppressHydrationWarning>
        {children}

        {/* Google AdSense loader — only injected when an AdSense client ID is configured. */}
        {adsenseClient && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
      </body>
    </html>
  );
}
