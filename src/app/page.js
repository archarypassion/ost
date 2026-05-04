"use client";

import Link from 'next/link';
import { ArrowRight, FileSearch, Link as LinkIcon, Activity, Zap, ShieldCheck, Globe, Search, Code2, Smartphone, Hash, Type, Map, Tag, Lock, Calendar, Repeat, Archive, Maximize, Fingerprint, FileText, Image } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const toolCategories = [
  {
    title: 'Indexation Tools',
    description: 'Verify what search engines can see on your website.',
    tools: [
      { name: 'Noindex Checker', path: '/tools/noindex-checker', icon: FileSearch },
      { name: 'Robots.txt Checker', path: '/tools/robots-txt', icon: FileText },
      { name: 'Sitemap Checker', path: '/tools/sitemap-checker', icon: Map },
      { name: 'Google Index Checker', path: '/tools/google-index', icon: Search },
    ],
  },
  {
    title: 'On-Page SEO Tools',
    description: 'Analyze and optimize your content structure for higher rankings.',
    tools: [
      { name: 'On-Page SEO', path: '/tools/on-page-seo', icon: Activity },
      { name: 'Meta Tags', path: '/tools/meta-tags', icon: Tag },
      { name: 'Open Graph', path: '/tools/open-graph', icon: Image },
      { name: 'Schema Markup', path: '/tools/schema-checker', icon: Code2 },
      { name: 'Canonical URL', path: '/tools/canonical-url', icon: Fingerprint },
      { name: 'Keyword Density', path: '/tools/keyword-density', icon: Hash },
      { name: 'Word Count', path: '/tools/word-count', icon: Type },
    ],
  },
  {
    title: 'Link & Redirect Tools',
    description: 'Find broken links, trace redirects, and check server responses.',
    tools: [
      { name: 'Link Checker', path: '/tools/link-checker', icon: LinkIcon },
      { name: 'Redirect Checker', path: '/tools/redirect-checker', icon: Repeat },
      { name: 'HTTP Status', path: '/tools/http-status', icon: Activity },
    ],
  },
  {
    title: 'Performance Tools',
    description: 'Measure speed, compression, and mobile readiness.',
    tools: [
      { name: 'Gzip Checker', path: '/tools/gzip-checker', icon: Archive },
      { name: 'Page Size', path: '/tools/page-size', icon: Maximize },
      { name: 'Page Speed', path: '/tools/page-speed', icon: Zap },
      { name: 'Mobile Friendly', path: '/tools/mobile-friendly', icon: Smartphone },
    ],
  },
  {
    title: 'Domain & Server Tools',
    description: 'Inspect certificates, DNS, and domain registration data.',
    tools: [
      { name: 'SSL Checker', path: '/tools/ssl-checker', icon: Lock },
      { name: 'Domain Age', path: '/tools/domain-age', icon: Calendar },
      { name: 'IP Lookup', path: '/tools/ip-lookup', icon: Globe },
    ],
  },
];

export default function Home() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="landing-page">
      {/* ── Top Nav ── */}
      <nav className="landing-nav">
        <div className="landing-nav-left">
          <Link href="/" className="landing-brand">TrueSEO</Link>
          <div className="landing-nav-links">
            <Link href="/tools/noindex-checker">Tools</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div className="landing-nav-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/tools/noindex-checker" className="nav-cta">Open Tools</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-dark">
        <div className="hero-dark-glow" />
        <div className="hero-dark-content">
          <p className="hero-eyebrow">Free SEO toolkit — 20+ professional-grade tools</p>
          <h1 className="hero-dark-title">SEO tools for every<br />developer and marketer</h1>
          <p className="hero-dark-sub">
            Analyze indexation, audit on-page elements, trace redirects, and measure performance — all from one fast, clean interface.
          </p>
          <div className="hero-dark-actions">
            <Link href="/tools/noindex-checker" className="hero-btn-primary">
              Explore Tools <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="hero-btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick Start Cards ── */}
      <section className="quick-start">
        <h2 className="qs-title">Get started with the right tool</h2>
        <div className="qs-grid">
          {[
            { title: 'Check Indexation', desc: 'See if search engines can find and index your pages.', path: '/tools/noindex-checker', color: '#4285F4' },
            { title: 'Audit On-Page SEO', desc: 'Analyze titles, headings, meta tags, and content structure.', path: '/tools/on-page-seo', color: '#EA4335' },
            { title: 'Test Performance', desc: 'Measure Core Web Vitals, page size, and compression.', path: '/tools/page-speed', color: '#34A853' },
            { title: 'Inspect Server', desc: 'Check SSL certificates, domain age, and IP addresses.', path: '/tools/ssl-checker', color: '#FBBC05' },
          ].map(card => (
            <Link key={card.title} href={card.path} className="qs-card">
              <div className="qs-card-bar" style={{ backgroundColor: card.color }} />
              <h3 className="qs-card-title">{card.title}</h3>
              <p className="qs-card-desc">{card.desc}</p>
              <span className="qs-card-link">View tools <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Full Tool Categories ── */}
      {toolCategories.map((cat, ci) => (
        <section key={cat.title} className={`cat-section ${ci % 2 === 0 ? 'cat-light' : 'cat-dark'}`}>
          <div className="cat-inner">
            <div className="cat-header">
              <h2 className="cat-title">{cat.title}</h2>
              <p className="cat-desc">{cat.description}</p>
            </div>
            <div className="cat-grid">
              {cat.tools.map(tool => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.name} href={tool.path} className="cat-card">
                    <Icon size={20} className="cat-card-icon" />
                    <div>
                      <h4 className="cat-card-name">{tool.name}</h4>
                      <span className="cat-card-arrow">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <h2 className="cta-banner-title">Ready to optimize your website?</h2>
        <p className="cta-banner-sub">All tools are free. No sign-up required. Start analyzing now.</p>
        <Link href="/tools/noindex-checker" className="hero-btn-primary" style={{ marginTop: '1rem' }}>
          Open TrueSEO Tools <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-col">
            <h4>Tools</h4>
            <Link href="/tools/noindex-checker">Noindex Checker</Link>
            <Link href="/tools/on-page-seo">On-Page SEO</Link>
            <Link href="/tools/link-checker">Link Checker</Link>
            <Link href="/tools/page-speed">Page Speed</Link>
            <Link href="/tools/ssl-checker">SSL Checker</Link>
          </div>
          <div className="footer-col">
            <h4>More Tools</h4>
            <Link href="/tools/redirect-checker">Redirect Checker</Link>
            <Link href="/tools/meta-tags">Meta Tags</Link>
            <Link href="/tools/schema-checker">Schema Markup</Link>
            <Link href="/tools/gzip-checker">Gzip Checker</Link>
            <Link href="/tools/domain-age">Domain Age</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TrueSEO. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
