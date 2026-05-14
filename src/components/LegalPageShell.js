'use client';

import LandingSiteFooter from '@/components/LandingSiteFooter';
import LandingSiteNav from '@/components/LandingSiteNav';

export default function LegalPageShell({ children }) {
  return (
    <div className="landing-page">
      <LandingSiteNav />

      <main className="legal-page-main">{children}</main>

      <LandingSiteFooter />
    </div>
  );
}
