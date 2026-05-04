"use client";
import Link from 'next/link';

export default function AboutPage() {
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
          <h2>About TrueSeo</h2>
          <p>Welcome to TrueSeo, your all-in-one suite of premium technical SEO tools.</p>
          <p>We built TrueSeo with a single goal in mind: to provide modern developers, agencies, and marketers with reliable, lightning-fast, and highly accurate tools to audit and optimize their web properties. Search Engine Optimization shouldn't be a black box, and it shouldn't require bloated, confusing software to get actionable insights.</p>
          
          <h3>Our Mission</h3>
          <p>Our mission is to democratize technical SEO by offering professional-grade diagnostic tools in a clean, distraction-free environment. Whether you're investigating indexation issues, auditing server responses, or optimizing Core Web Vitals, TrueSeo gives you the exact data you need without the noise.</p>
          
          <h3>Why We Built This</h3>
          <p>As web professionals, we grew frustrated with the fragmented landscape of SEO tools. We found ourselves jumping between five different websites just to check a canonical tag, validate schema markup, and test a redirect chain. TrueSeo unifies these essential utilities into a single, cohesive platform designed around the principles of speed and simplicity.</p>

          <p style={{ marginTop: '2rem' }}>Ready to optimize? <Link href="/tools/noindex-checker" style={{ color: '#1A73E8' }}>Explore our tools</Link>.</p>
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
