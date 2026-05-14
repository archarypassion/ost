"use client";

import Link from 'next/link';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from './Layout';

export default function Header({ toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={24} />
        </button>
        <Link href="/" className="logo">
          <div className="logo-icon"></div>
          <span>TRUESEO</span>
        </Link>
      </div>
      <div className="header-right">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
