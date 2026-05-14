'use client';

import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/tools-catalog';

const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} — question`)}`;

export default function ContactPage() {
  return (
    <LegalPageShell>
      <article className="tool-article" style={{ width: '100%' }}>
        <h1>Contact</h1>
        <p>
          We welcome questions about how the tools work, suggestions for improvements, and reports of
          incorrect or confusing results.
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginTop: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Help and general enquiries</h2>
          <p style={{ marginBottom: 0 }}>
            Email:{' '}
            <a href={mailto} style={{ color: 'var(--accent-color, #1A73E8)' }}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <h2 style={{ marginTop: '2rem' }}>Privacy and data</h2>
        <p>
          For privacy-related requests (including questions about how we handle URLs you submit),
          please email the same address with a clear subject line such as &ldquo;Privacy&rdquo; or
          &ldquo;Data question&rdquo;.           See also our{' '}
          <Link href="/privacy" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Privacy Policy
          </Link>
          .
        </p>

        <h2>Bugs and feature ideas</h2>
        <p>
          If something looks broken, include the tool name, the URL or input you used (if safe to
          share), and what you expected versus what you saw. We read every message; we cannot promise
          a reply to every suggestion, but they do influence what we ship next.
        </p>
      </article>
    </LegalPageShell>
  );
}
