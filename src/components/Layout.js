"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const toggleSidebar = () => setSidebarOpen((o) => !o);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app-container">
        <Header toggleSidebar={toggleSidebar} />
        <div className="main-wrapper">
          <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
            <Sidebar />
          </div>
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
