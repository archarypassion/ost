"use client";

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PagePathBar from './PagePathBar';

export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

const MOBILE_MAX_WIDTH = 768;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    if (window.matchMedia(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`).matches) {
      setSidebarOpen(true);
    }

    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const onMobile = (e) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', onMobile);
    return () => mq.removeEventListener('change', onMobile);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const toggleSidebar = () => setSidebarOpen((o) => !o);

  const closeSidebar = useCallback(() => {
    if (isMobileViewport()) setSidebarOpen(false);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app-container">
        <Header toggleSidebar={toggleSidebar} />
        <div className="main-wrapper">
          <button
            type="button"
            className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            tabIndex={sidebarOpen ? 0 : -1}
          />
          <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
            <Sidebar onNavigate={closeSidebar} />
          </div>
          <main className="main-content">
            <PagePathBar />
            {children}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
