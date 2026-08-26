import { DM_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/tools-catalog";

const dmSans = DM_Sans({ subsets: ["latin"] });

const siteUrl = getSiteUrl();
const googleVerification = "FClmBzRS03b9wUSRR5L5SPTE6rE5v5Wsgy8l6A_uSNc";
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || null;
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || null;
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-8476288439860728";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Free, fast, accurate SEO tools — sitemap checker, robots tester, on-page audit, " +
    "schema validator, redirect tracer, page speed and more. No sign-up required.",
  applicationName: SITE_NAME,
  keywords: [
    "SEO tools",
    "sitemap checker",
    "robots.txt tester",
    "on-page SEO audit",
    "schema validator",
    "meta tag checker",
    "open graph checker",
    "redirect checker",
    "broken link checker",
    "page speed",
    "gzip checker",
    "SSL checker",
    "WHOIS",
    "DNS lookup",
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  other: {
    "google-adsense-account": "ca-pub-8476288439860728",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "A complete suite of SEO and webmaster tools that run in your browser.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "A complete suite of SEO and webmaster tools that run in your browser.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Site-verification meta tags.
  verification: {
    google: googleVerification || undefined,
    other: {
      ...(bingVerification ? { "msvalidate.01": bingVerification } : {}),
      ...(yandexVerification
        ? { "yandex-verification": yandexVerification }
        : {}),
      "google-adsense-account": "ca-pub-8476288439860728",
    },
  },
};

import ConsentBanner from "@/components/ConsentBanner";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={dmSans.className}>
      <head>
        {/* Google Consent Mode v2 Default Initialization */}
        <script
          id="google-consent-mode-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              (function() {
                try {
                  var stored = localStorage.getItem('ost_user_consent_v2');
                  if (stored) {
                    var prefs = JSON.parse(stored);
                    gtag('consent', 'default', {
                      'ad_storage': prefs.marketing ? 'granted' : 'denied',
                      'ad_user_data': prefs.marketing ? 'granted' : 'denied',
                      'ad_personalization': prefs.personalization ? 'granted' : 'denied',
                      'analytics_storage': prefs.analytics ? 'granted' : 'denied',
                      'wait_for_update': 500
                    });
                    return;
                  }
                } catch(e) {}
                gtag('consent', 'default', {
                  'ad_storage': 'denied',
                  'ad_user_data': 'denied',
                  'ad_personalization': 'denied',
                  'analytics_storage': 'denied',
                  'wait_for_update': 500
                });
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}

        {/* Global Google-Certified CMP & GDPR Consent Banner */}
        <ConsentBanner />

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

        <Analytics />
      </body>
    </html>
  );
}
