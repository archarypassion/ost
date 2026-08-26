"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Zap,
  Gauge,
  Globe,
  Search,
  Activity,
  Lock,
  Sun,
  Moon,
  Star,
  TrendingUp,
  BarChart3,
  Layers,
  Eye,
  Rocket,
  FileSearch,
  Link as LinkIcon,
  Code2,
  Smartphone,
  Hash,
  Type,
  Map,
  Tag,
  Calendar,
  Repeat,
  Archive,
  Maximize,
  Fingerprint,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  MailCheck,
  Bot,
  Share2,
  Binary,
  Contrast,
  Braces,
  CodeXml,
  Languages,
  ImageOff,
  BookOpen,
  Shuffle,
  Network,
  Radio,
  Cookie,
  Smile,
  CaseSensitive,
  FileCode,
  Key,
  ListFilter,
  PenTool,
  ShieldAlert,
} from 'lucide-react';
import LandingSiteFooter from '@/components/LandingSiteFooter';
import {
  SITE_NAME,
  TOOLS,
  HOME_GROUP_ORDER,
  HOME_GROUP_META,
} from '@/lib/tools-catalog';

const ICON_BY_SLUG = {
  // Indexation
  'noindex-checker': FileSearch,
  'robots-txt': FileText,
  'robots-generator': Bot,
  'sitemap-checker': Map,
  'google-index': Search,
  // On-Page
  'on-page-seo': Activity,
  'meta-tags': Tag,
  'meta-description-generator': PenTool,
  'open-graph': ImageIcon,
  'social-preview': Share2,
  'schema-checker': Code2,
  'schema-generator': Sparkles,
  'canonical-url': Fingerprint,
  'hreflang-generator': Languages,
  'broken-image-checker': ImageOff,
  'keyword-density': Hash,
  'word-count': Type,
  'readability-checker': BookOpen,
  'slug-generator': FileText,
  // Links & Redirects
  'link-checker': LinkIcon,
  'redirect-checker': Repeat,
  'http-status': Activity,
  'utm-builder': Share2,
  'url-encoder': Binary,
  'keyword-mixer': Shuffle,
  // Performance
  'gzip-checker': Archive,
  'page-size': Maximize,
  'page-speed': Zap,
  'mobile-friendly': Smartphone,
  'color-contrast': Contrast,
  // Domain & Security
  'ssl-checker': Lock,
  'security-headers': ShieldCheck,
  'dmarc-checker': MailCheck,
  'dns-propagation': Network,
  'http-protocol-checker': Radio,
  'cookie-checker': Cookie,
  'favicon-checker': Smile,
  'domain-age': Calendar,
  'ip-lookup': Globe,
  // Developer Utilities
  'json-formatter': Braces,
  'case-converter': CaseSensitive,
  'base64-encoder': Binary,
  'regex-tester': Code2,
  'markdown-previewer': FileCode,
  'css-minifier': FileCode,
  'uuid-generator': Key,
  'hash-generator': Fingerprint,
  'text-deduplicator': ListFilter,
  'lorem-generator': FileText,
  'cors-checker': ShieldAlert,
  'html-entity': CodeXml,
};

const ALL_TOOLS = TOOLS.map((t) => ({
  ...t,
  path: `/tools/${t.slug}`,
  icon: ICON_BY_SLUG[t.slug] || Activity,
}));

/* Category accent colors for the new row-list design */
const GROUP_ACCENTS = {
  'Indexation':          { color: '#3B82F6', glow: 'rgba(59,130,246,0.18)',  bg: 'rgba(59,130,246,0.07)' },
  'On-Page':             { color: '#8B5CF6', glow: 'rgba(139,92,246,0.18)', bg: 'rgba(139,92,246,0.07)' },
  'Links & Redirects':   { color: '#06B6D4', glow: 'rgba(6,182,212,0.18)',  bg: 'rgba(6,182,212,0.07)'  },
  'Performance':         { color: '#10B981', glow: 'rgba(16,185,129,0.18)', bg: 'rgba(16,185,129,0.07)' },
  'Domain & Server':     { color: '#F59E0B', glow: 'rgba(245,158,11,0.18)', bg: 'rgba(245,158,11,0.07)'  },
  'Developer Utilities': { color: '#EC4899', glow: 'rgba(236,72,153,0.18)', bg: 'rgba(236,72,153,0.07)' },
};

function colorMixWithAlpha(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return hex;
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

const FEATURE_BENTO = [
  {
    span: 'hero',
    icon: Search,
    eyebrow: 'Indexation',
    title: 'See exactly what Google sees',
    desc: 'Robots.txt, sitemaps, noindex directives, and X-Robots-Tag headers — audited together to give one definitive verdict on whether your page can rank.',
    accent: '#3B82F6',
  },
  {
    span: 'tall',
    icon: Gauge,
    eyebrow: 'Performance',
    title: 'Real network timings',
    desc: 'DNS, TCP, TLS, TTFB and total download — measured the way browsers actually load your pages.',
    accent: '#22D3EE',
  },
  {
    span: 'compact',
    icon: BarChart3,
    eyebrow: 'On-Page',
    title: '17-point audit',
    desc: 'Titles, headings, schema, canonicals — scored 0–100.',
    accent: '#60A5FA',
  },
  {
    span: 'compact',
    icon: Shield,
    eyebrow: 'Server & SSL',
    title: 'Real TLS handshake',
    desc: 'Live certificate chain, expiry, hostname match and key strength.',
    accent: '#38BDF8',
  },
  {
    span: 'full',
    icon: Layers,
    eyebrow: 'Links & Redirects',
    title: 'Trace every hop, find every break',
    desc: 'Parallel probes across hundreds of links, full 301/302 chain visibility, and HTTP status snapshots with response headers.',
    accent: '#0EA5E9',
  },
];

const HOW_STEPS = [
  {
    n: '01',
    icon: LinkIcon,
    title: 'Paste any URL',
    desc: 'No login. No setup. Drop in the page you want to inspect.',
  },
  {
    n: '02',
    icon: Zap,
    title: 'Run a real-time scan',
    desc: 'We fetch live HTML, headers, certificates, and DNS — never cached guesses.',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'Read the verdict',
    desc: 'Scored, prioritized, and explained — copy/paste ready for your team.',
  },
];

const SCAN_DEMO_ROWS = [
  { label: 'Title tag', value: 'Looks good · 58 chars', ok: true },
  { label: 'Meta description', value: '152 chars', ok: true },
  { label: 'Canonical URL', value: 'Self-referencing', ok: true },
  { label: 'H1 tag', value: '1 found', ok: true },
  { label: 'Schema markup', value: 'JSON-LD · Article', ok: true },
  { label: 'Indexable', value: 'Yes', ok: true },
];

export default function Home() {
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  };

  // Filtered grouped list by search query and category
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HOME_GROUP_ORDER
      .filter((groupKey) => selectedGroup === 'All' || selectedGroup === groupKey)
      .map((groupKey) => {
        const meta = HOME_GROUP_META[groupKey];
        const tools = ALL_TOOLS.filter((t) => {
          if (t.group !== groupKey) return false;
          if (!q) return true;
          return (
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.slug.toLowerCase().includes(q)
          );
        });
        return {
          key: groupKey,
          title: meta.title,
          description: meta.description,
          tools,
          accent: GROUP_ACCENTS[groupKey] || GROUP_ACCENTS['Indexation'],
        };
      })
      .filter((g) => g.tools.length > 0);
  }, [searchQuery, selectedGroup]);

  const totalFilteredTools = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.tools.length, 0);
  }, [filteredGroups]);

  return (
    <div className="landing-v2">
      <div className="lv2-page-glow" aria-hidden="true" />

      {/* ── Sticky glass nav ── */}
      <nav className="lv2-nav">
        <div className="lv2-nav-inner">
          <Link href="/" className="lv2-brand">
            <span className="lv2-brand-name">{SITE_NAME}</span>
          </Link>

          <div className="lv2-nav-links">
            <a href="#tools">Tools</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <Link href="/about">About</Link>
          </div>

          <div className="lv2-nav-right">
            <button
              type="button"
              className="lv2-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/tools/noindex-checker" className="lv2-nav-cta">
              Launch tools <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lv2-hero">
        <div className="lv2-hero-orb" aria-hidden="true" />
        <div className="lv2-hero-orb lv2-hero-orb-2" aria-hidden="true" />
        <div className="lv2-hero-grid" aria-hidden="true" />

        <div className="lv2-hero-inner">
          <div className="lv2-hero-copy">
            <span className="lv2-pill">
              <Sparkles size={13} />
              {TOOLS.length} production-grade SEO tools · free forever
            </span>

            <h1 className="lv2-hero-title">
              The complete SEO toolkit{' '}
              <span className="lv2-grad">built for serious teams</span>
            </h1>

            <p className="lv2-hero-sub">
              Audit indexation, trace redirects, validate schema, and measure real-world
              performance — all from one fast, beautifully crafted interface. No sign-up.
              No limits.
            </p>

            <div className="lv2-hero-actions">
              <a href="#tools" className="lv2-btn-primary">
                Explore {TOOLS.length} tools <ArrowRight size={16} />
              </a>
              <Link href="/about" className="lv2-btn-ghost">
                Learn more
              </Link>
            </div>

            <div className="lv2-hero-trust">
              <span><Check size={14} /> Zero sign-up</span>
              <span><Check size={14} /> Free forever</span>
              <span><Check size={14} /> 100% private</span>
            </div>
          </div>

          {/* Floating scanner preview */}
          <div className="lv2-hero-preview" aria-hidden="true">
            <div className="lv2-preview-glow" />
            <div className="lv2-preview-card">
              <div className="lv2-preview-top">
                <span className="lv2-preview-dot lv2-preview-dot-r" />
                <span className="lv2-preview-dot lv2-preview-dot-y" />
                <span className="lv2-preview-dot lv2-preview-dot-g" />
                <div className="lv2-preview-url">
                  <Lock size={11} /> https://www.opensourcetools.online
                </div>
              </div>
              <div className="lv2-preview-body">
                <div className="lv2-preview-score">
                  <div className="lv2-score-ring">
                    <svg viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" className="lv2-score-track" />
                      <circle cx="18" cy="18" r="16" className="lv2-score-arc" />
                    </svg>
                    <div className="lv2-score-num">96</div>
                  </div>
                  <div className="lv2-score-meta">
                    <span className="lv2-score-label">SEO Score</span>
                    <span className="lv2-score-status">
                      <span className="lv2-status-dot" /> Healthy
                    </span>
                  </div>
                </div>
                <ul className="lv2-preview-rows">
                  {SCAN_DEMO_ROWS.map((r) => (
                    <li key={r.label}>
                      <span className="lv2-row-check"><Check size={11} /></span>
                      <span className="lv2-row-label">{r.label}</span>
                      <span className="lv2-row-value">{r.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats / trust strip ── */}
      <section className="lv2-stats">
        <div className="lv2-stat">
          <span className="lv2-stat-num">{TOOLS.length}</span>
          <span className="lv2-stat-lab">SEO tools shipped</span>
        </div>
        <div className="lv2-stat-divider" />
        <div className="lv2-stat">
          <span className="lv2-stat-num">0</span>
          <span className="lv2-stat-lab">Sign-ups required</span>
        </div>
        <div className="lv2-stat-divider" />
        <div className="lv2-stat">
          <span className="lv2-stat-num">100%</span>
          <span className="lv2-stat-lab">Free, no paywalls</span>
        </div>
        <div className="lv2-stat-divider" />
        <div className="lv2-stat">
          <span className="lv2-stat-num">&lt;2s</span>
          <span className="lv2-stat-lab">Average scan time</span>
        </div>
      </section>

      {/* ── Bento features ── */}
      <section className="lv2-features" id="features">
        <div className="lv2-section-head">
          <span className="lv2-tag">Capabilities</span>
          <h2 className="lv2-section-title">
            Everything you need to <span className="lv2-grad">rank higher</span>
          </h2>
          <p className="lv2-section-sub">
            Built by SEO obsessives. Designed for speed, accuracy, and zero friction.
          </p>
        </div>

        <div className="lv2-bento">
          {FEATURE_BENTO.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`lv2-bento-card lv2-bento-${f.span}`}
                style={{ '--card-accent': f.accent }}
              >
                <div className="lv2-bento-icon">
                  <Icon size={18} />
                </div>
                <span className="lv2-bento-eyebrow">{f.eyebrow}</span>
                <h3 className="lv2-bento-title">{f.title}</h3>
                <p className="lv2-bento-desc">{f.desc}</p>
                <div className="lv2-bento-shine" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Tool catalog — command palette row list with instant search ── */}
      <section className="lv2-catalog" id="tools">
        <div className="lv2-section-head">
          <span className="lv2-tag">The full toolkit</span>
          <h2 className="lv2-section-title">
            {TOOLS.length} tools, <span className="lv2-grad">one platform</span>
          </h2>
          <p className="lv2-section-sub">
            Search or filter across all {TOOLS.length} technical diagnostics and webmaster utilities.
          </p>
        </div>

        {/* Live Search & Category Filter Toolbar */}
        <div style={{ maxWidth: '820px', margin: '0 auto 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="search-bar" style={{ width: '100%', maxWidth: '820px' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '0.75rem', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${TOOLS.length} tools (e.g. "json", "cookie", "meta", "dns", "contrast")...`}
              className="search-input"
              style={{ fontSize: '0.9375rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="lv2-pill-btn"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {['All', ...HOME_GROUP_ORDER].map((group) => {
              const isActive = selectedGroup === group;
              const accent = GROUP_ACCENTS[group]?.color || 'var(--lv2-blue-light)';
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={`lv2-pill-btn ${isActive ? 'active' : ''}`}
                  style={{
                    borderColor: isActive ? accent : undefined,
                    color: isActive ? accent : undefined,
                    backgroundColor: isActive ? colorMixWithAlpha(accent, 0.12) : undefined,
                  }}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="lv2-cat-empty" style={{ margin: '2rem auto', maxWidth: '600px', textAlign: 'center', justifyContent: 'center' }}>
            <div>
              <strong>No tools matched &quot;{searchQuery}&quot;</strong>
              <span>Try searching for a different keyword or resetting your filter.</span>
            </div>
            <button
              type="button"
              className="lv2-btn-ghost"
              onClick={() => { setSearchQuery(''); setSelectedGroup('All'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="lv2-rowlist">
            {filteredGroups.map((cat) => (
              <div key={cat.key} className="lv2-rowlist-group">
                {/* Category divider label */}
                <div className="lv2-rowlist-divider" style={{ '--cat-color': cat.accent.color }}>
                  <span className="lv2-rowlist-divider-label">{cat.title.toUpperCase()}</span>
                  <span className="lv2-rowlist-divider-line" />
                  <span className="lv2-rowlist-divider-count">{cat.tools.length}</span>
                </div>

                {/* Tool rows */}
                <div className="lv2-rowlist-rows">
                  {cat.tools.map((tool, idx) => {
                    const Icon = tool.icon || Activity;
                    return (
                      <Link
                        key={tool.path}
                        href={tool.path}
                        className="lv2-row-item"
                        style={{
                          '--row-accent': cat.accent.color,
                          '--row-glow': cat.accent.glow,
                          '--row-bg': cat.accent.bg,
                          animationDelay: `${idx * 35}ms`,
                        }}
                      >
                        <span className="lv2-row-icon" style={{ '--row-accent': cat.accent.color }}>
                          <Icon size={17} />
                        </span>
                        <span className="lv2-row-content">
                          <span className="lv2-row-name">{tool.name}</span>
                          <span className="lv2-row-desc">{tool.description}</span>
                        </span>
                        <span className="lv2-row-meta">
                          <span className="lv2-row-cat-badge" style={{ '--row-accent': cat.accent.color }}>
                            {cat.key}
                          </span>
                          <ArrowRight size={15} className="lv2-row-arrow" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="lv2-how" id="how">
        <div className="lv2-section-head">
          <span className="lv2-tag">How it works</span>
          <h2 className="lv2-section-title">
            Get answers in <span className="lv2-grad">three steps</span>
          </h2>
        </div>

        <div className="lv2-how-grid">
          {HOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="lv2-how-card">
                <span className="lv2-how-num">{step.n}</span>
                <span className="lv2-how-icon">
                  <Icon size={18} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {idx < HOW_STEPS.length - 1 && (
                  <span className="lv2-how-connector" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Trust quote / badges ── */}
      <section className="lv2-trust-section">
        <div className="lv2-trust-card">
          <div className="lv2-trust-stars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={14} fill="currentColor" />
            ))}
          </div>
          <p className="lv2-trust-quote">
            &ldquo;The cleanest, fastest SEO inspector I&apos;ve used in years. It just
            shows me what&apos;s wrong without trying to sell me anything.&rdquo;
          </p>
          <div className="lv2-trust-meta">
            <div className="lv2-trust-avatar" aria-hidden="true" />
            <div>
              <strong>Independent developer</strong>
              <span>Built sites that rank top-3 on Google</span>
            </div>
          </div>
        </div>

        <div className="lv2-trust-grid">
          <div className="lv2-trust-item">
            <Eye size={18} />
            <strong>Privacy-first</strong>
            <span>We never store the URLs you scan.</span>
          </div>
          <div className="lv2-trust-item">
            <Rocket size={18} />
            <strong>Lightning fast</strong>
            <span>Average scan finishes in under 2 seconds.</span>
          </div>
          <div className="lv2-trust-item">
            <Shield size={18} />
            <strong>Always free</strong>
            <span>No paid tier. No upsells. No sign-up.</span>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="lv2-cta">
        <div className="lv2-cta-orb" aria-hidden="true" />
        <div className="lv2-cta-inner">
          <span className="lv2-pill">
            <Sparkles size={13} />
            Ready when you are
          </span>
          <h2 className="lv2-cta-title">
            Start your first scan in <span className="lv2-grad">under 10 seconds</span>
          </h2>
          <p className="lv2-cta-sub">
            Paste any URL. Get a real, actionable SEO verdict. No account required.
          </p>
          <div className="lv2-hero-actions" style={{ justifyContent: 'center' }}>
            <Link href="/tools/noindex-checker" className="lv2-btn-primary">
              Launch {SITE_NAME} <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="lv2-btn-ghost">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <LandingSiteFooter />
    </div>
  );
}
