'use client';

import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { SITE_NAME } from '@/lib/tools-catalog';

export default function AboutPage() {
  return (
    <LegalPageShell>
      <article className="tool-article" style={{ width: '100%' }}>
        <h1>About {SITE_NAME}</h1>
        <p>
          {SITE_NAME} is a free collection of technical SEO and web diagnostics tools. We built it for
          developers, marketers, and agencies who need fast, accurate checks without signing up for
          another dashboard.
        </p>
        <p>
          The site focuses on indexation, on-page signals, links and redirects, performance, and
          domain or server data. Each tool is designed to show clear results and explain limits where
          third-party data or platform restrictions apply.
        </p>

        <h2>What we believe</h2>
        <p>
          SEO tooling should be transparent: you should understand what was measured, what was inferred,
          and what still requires your own judgment or access (for example, Google Search Console).
        </p>

        <h2>Get in touch</h2>
        <p>
          For help, feedback, or legal questions, use the details on our{' '}
          <Link href="/contact" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Contact
          </Link>{' '}
          page.
        </p>

        <p style={{ marginTop: '2rem' }}>
          <Link href="/tools/noindex-checker" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Browse all tools
          </Link>
          .
        </p>
      </article>
    </LegalPageShell>
  );
}
