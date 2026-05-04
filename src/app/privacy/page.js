"use client";
import Link from 'next/link';

export default function PrivacyPage() {
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
          <h2>Privacy Policy</h2>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <p>At TrueSeo, we take your privacy seriously. This Privacy Policy outlines the types of personal information we receive and collect when you use TrueSeo, as well as some of the steps we take to safeguard information.</p>
          
          <h3>1. Information We Collect</h3>
          <p><strong>Log Files:</strong> Like many other websites, TrueSeo makes use of log files. The information inside the log files includes internet protocol (IP) addresses, type of browser, Internet Service Provider (ISP), date/time stamp, referring/exit pages, and number of clicks to analyze trends, administer the site, track user's movement around the site, and gather demographic information.</p>
          <p><strong>Tool Usage Data:</strong> When you use our tools to analyze URLs, we may temporarily log the URLs checked for abuse prevention and system monitoring. We do not store or analyze the content of the pages you check for our own purposes.</p>

          <h3>2. Cookies and Web Beacons</h3>
          <p>We do use cookies to store information about visitors' preferences, to record user-specific information on which pages the site visitor accesses or visits, and to customize our web page content based on visitors' browser type or other information that the visitor sends via their browser. This includes storing your theme preference (Light/Dark mode).</p>

          <h3>3. Data Security</h3>
          <p>We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information.</p>

          <h3>4. Third-Party Links</h3>
          <p>Occasionally, at our discretion, we may include or offer third-party products or services on our website. These third-party sites have separate and independent privacy policies. We therefore have no responsibility or liability for the content and activities of these linked sites.</p>

          <h3>5. Consent</h3>
          <p>By using our website, you hereby consent to our privacy policy and agree to its terms.</p>
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
