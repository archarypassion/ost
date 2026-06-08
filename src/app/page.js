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
} from 'lucide-react';
import LandingSiteFooter from '@/components/LandingSiteFooter';
import {
  SITE_NAME,
  TOOLS,
  HOME_GROUP_ORDER,
  HOME_GROUP_META,
} from '@/lib/tools-catalog';

const ICON_BY_SLUG = {
  'noindex-checker': FileSearch,
  'robots-txt': FileText,
  'sitemap-checker': Map,
  'google-index': Search,
  'on-page-seo': Activity,
  'meta-tags': Tag,
  'open-graph': ImageIcon,
  'schema-checker': Code2,
  'canonical-url': Fingerprint,
  'keyword-density': Hash,
  'word-count': Type,
  'link-checker': LinkIcon,
  'redirect-checker': Repeat,
  'http-status': Activity,
  'gzip-checker': Archive,
  'page-size': Maximize,
  'page-speed': Zap,
  'mobile-friendly': Smartphone,
  'ssl-checker': Lock,
  'domain-age': Calendar,
  'ip-lookup': Globe,
};

const ALL_TOOLS = TOOLS.map((t) => ({
  ...t,
  path: `/tools/${t.slug}`,
  icon: ICON_BY_SLUG[t.slug] || Activity,
}));

const GROUP_FILTERS = ['All', ...HOME_GROUP_ORDER];

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
  const [activeGroup, setActiveGroup] = useState('All');

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

  // Grouped tool list filtered by category. Memoized so we don't re-walk the catalog
  // on every render.
  const filteredGroups = useMemo(() => {
    const matches = ALL_TOOLS.filter(
      (t) => activeGroup === 'All' || t.group === activeGroup,
    );
    return HOME_GROUP_ORDER.map((groupKey) => {
      const meta = HOME_GROUP_META[groupKey];
      const tools = matches.filter((t) => t.group === groupKey);
      return { key: groupKey, title: meta.title, description: meta.description, tools };
    }).filter((g) => g.tools.length > 0);
  }, [activeGroup]);

  const totalMatching = filteredGroups.reduce((sum, g) => sum + g.tools.length, 0);

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

      {/* ── Tool catalog ── */}
      <section className="lv2-catalog" id="tools">
        <div className="lv2-section-head">
          <span className="lv2-tag">The full toolkit</span>
          <h2 className="lv2-section-title">
            {TOOLS.length} tools, <span className="lv2-grad">one platform</span>
          </h2>
          <p className="lv2-section-sub">
            Pick a category to jump straight to the tool you need.
          </p>
        </div>

        {/* Category filter — one tap to narrow the catalog. */}
        <div className="lv2-cat-controls">
          <div className="lv2-pills" role="tablist" aria-label="Filter tools by category">
            {GROUP_FILTERS.map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={activeGroup === g}
                className={`lv2-pill-btn ${activeGroup === g ? 'active' : ''}`}
                onClick={() => setActiveGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {totalMatching === 0 ? (
          <div className="lv2-cat-empty">
            <div>
              <strong>No tools in this category yet.</strong>
              <span>Try a different filter.</span>
            </div>
            <button
              type="button"
              className="lv2-btn-ghost"
              onClick={() => setActiveGroup('All')}
            >
              Show all tools
            </button>
          </div>
        ) : (
          <div className="lv2-cat-stack">
            {filteredGroups.map((cat) => (
              <div key={cat.key} className="lv2-cat-group">
                <div className="lv2-cat-group-head">
                  <h3>
                    {cat.title}
                    <span className="lv2-cat-count">{cat.tools.length}</span>
                  </h3>
                  <p>{cat.description}</p>
                </div>
                <div className="lv2-cat-grid">
                  {cat.tools.map((tool) => {
                    const Icon = tool.icon || Activity;
                    return (
                      <Link
                        key={tool.path}
                        href={tool.path}
                        className="lv2-tool-card"
                        title={tool.description}
                      >
                        <span className="lv2-tool-icon">
                          <Icon size={18} />
                        </span>
                        <span className="lv2-tool-body">
                          <span className="lv2-tool-name">{tool.name}</span>
                          <span className="lv2-tool-desc">{tool.description}</span>
                        </span>
                        <ArrowRight size={16} className="lv2-tool-arrow" />
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
