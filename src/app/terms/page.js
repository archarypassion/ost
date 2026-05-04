"use client";
import Link from 'next/link';

export default function TermsPage() {
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
          <h2>Terms of Service</h2>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h3>1. Terms</h3>
          <p>By accessing the website at TrueSeo, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
          
          <h3>2. Use License</h3>
          <p>Permission is granted to temporarily use the tools on TrueSeo's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on TrueSeo's website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
          <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by TrueSeo at any time.</p>

          <h3>3. Disclaimer</h3>
          <p>The materials on TrueSeo's website are provided on an 'as is' basis. TrueSeo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          <p>Further, TrueSeo does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</p>

          <h3>4. Limitations</h3>
          <p>In no event shall TrueSeo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TrueSeo's website, even if TrueSeo or a TrueSeo authorized representative has been notified orally or in writing of the possibility of such damage.</p>

          <h3>5. Accuracy of materials</h3>
          <p>The materials appearing on TrueSeo's website could include technical, typographical, or photographic errors. TrueSeo does not warrant that any of the materials on its website are accurate, complete or current. TrueSeo may make changes to the materials contained on its website at any time without notice.</p>

          <h3>6. Modifications</h3>
          <p>TrueSeo may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
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
