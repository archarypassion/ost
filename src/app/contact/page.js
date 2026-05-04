"use client";
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/" className="logo">
             <span style={{color: '#4285F4', fontWeight: 500}}>T</span><span style={{color: '#EA4335', fontWeight: 500}}>r</span><span style={{color: '#FBBC05', fontWeight: 500}}>u</span><span style={{color: '#4285F4', fontWeight: 500}}>e</span><span style={{color: '#34A853', fontWeight: 500}}>S</span><span style={{color: '#EA4335', fontWeight: 500}}>e</span><span style={{color: 'var(--text-secondary)', fontWeight: 300}}>o</span>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/tools/noindex-checker" className="btn-primary">Go to Tools</Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '4rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <article className="tool-article" style={{ width: '100%' }}>
          <h2>Contact Us</h2>
          <p>Have questions, feedback, or feature requests? We'd love to hear from you.</p>
          
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>Get in Touch</h3>
            <p><strong>Email:</strong> support@trueseo.example.com</p>
            <p><strong>Twitter:</strong> @TrueSeoTools</p>
            <p><strong>Address:</strong><br />TrueSeo Technologies<br />123 Search Engine Blvd<br />San Francisco, CA 94105</p>
          </div>
          
          <h3 style={{ marginTop: '2rem' }}>Bug Reports & Feature Requests</h3>
          <p>If you've found a bug in one of our tools, or have a suggestion for a new tool that would make your SEO workflow easier, please email us directly with the subject line "Feature Request" or "Bug Report". We read and evaluate every submission.</p>

        </article>
      </main>

      <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <div style={{ padding: '15px 30px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
          <Link href="/about" style={{ color: 'inherit' }}>About</Link>
          <Link href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'inherit' }}>Terms of Service</Link>
          <Link href="/contact" style={{ color: 'inherit' }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
