'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { SITE_NAME } from '@/lib/tools-catalog';

function navCurrent(pathname, href) {
  if (href === '/tools/noindex-checker') {
    return pathname.startsWith('/tools') ? 'page' : undefined;
  }
  return pathname === href ? 'page' : undefined;
}

export default function LandingSiteNav() {
  const pathname = usePathname() || '';
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
    <nav className="landing-nav">
      <div className="landing-nav-left">
        <Link href="/" className="landing-brand">
          {SITE_NAME}
        </Link>
        <div className="landing-nav-links">
          <Link href="/tools/noindex-checker" aria-current={navCurrent(pathname, '/tools/noindex-checker')}>
            Tools
          </Link>
          <Link href="/about" aria-current={navCurrent(pathname, '/about')}>
            About
          </Link>
          <Link href="/contact" aria-current={navCurrent(pathname, '/contact')}>
            Contact
          </Link>
        </div>
      </div>
      <div className="landing-nav-right">
        <button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link href="/tools/noindex-checker" className="nav-cta">
          Open Tools
        </Link>
      </div>
    </nav>
  );
}
