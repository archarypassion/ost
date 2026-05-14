'use client';

import Link from 'next/link';
import { CONTACT_EMAIL, SITE_NAME, TOOLS } from '@/lib/tools-catalog';

const footerToolsPrimary = TOOLS.slice(0, 5);
const footerToolsSecondary = TOOLS.slice(5, 10);

export default function LandingSiteFooter() {
  return (
    <footer className="landing-footer">
      <div className="footer-top">
        <div className="footer-col">
          <h4>Tools</h4>
          {footerToolsPrimary.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`}>
              {t.name}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>More Tools</h4>
          {footerToolsSecondary.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`}>
              {t.name}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/disclaimer">Disclaimer</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Help: {CONTACT_EMAIL}</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </span>
        <div className="footer-bottom-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </div>
      </div>
    </footer>
  );
}
