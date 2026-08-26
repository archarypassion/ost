'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings, X, Check, Cookie, Lock } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'ost_user_consent_v2';

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: true,
    personalization: true,
  });

  useEffect(() => {
    // Check if user already consented
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) {
      // Delay display slightly for smooth entrance
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(stored);
        applyGtagConsent(parsed);
      } catch {}
    }
  }, []);

  // Listen for global custom event to reopen consent settings from footer
  useEffect(() => {
    const handleOpenSettings = () => {
      // If Google Funding Choices CMP is present, trigger its revocation dialog
      if (typeof window !== 'undefined' && window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
        window.googlefc.showRevocationMessage();
        return;
      }
      // Otherwise open native 3-choice certified CMP preferences modal
      setShowModal(true);
      setShowBanner(false);
    };

    window.addEventListener('open-consent-settings', handleOpenSettings);
    return () => window.removeEventListener('open-consent-settings', handleOpenSettings);
  }, []);

  const applyGtagConsent = (prefs) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        ad_user_data: prefs.marketing ? 'granted' : 'denied',
        ad_personalization: prefs.personalization ? 'granted' : 'denied',
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
      });
    }
  };

  const handleAcceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullConsent));
    applyGtagConsent(fullConsent);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(minimalConsent));
    applyGtagConsent(minimalConsent);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    const customConsent = {
      ...preferences,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(customConsent));
    applyGtagConsent(customConsent);
    setShowModal(false);
    setShowBanner(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* ── Fixed Bottom 3-Choice Consent Banner (GDPR / UK / Swiss Compliant) ── */}
      {showBanner && !showModal && (
        <div
          role="dialog"
          aria-label="Privacy & Cookie Consent"
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2.5rem)',
            maxWidth: '1020px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            borderRadius: '16px',
            padding: '1.5rem',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            animation: 'bannerSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--lv2-blue-light)' }}>
                <Cookie size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>
                  We Value Your Privacy &amp; Data Choices
                </h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.55, margin: 0, color: 'var(--text-secondary)' }}>
                  We and our Google-certified advertising partners use cookies and device identifiers to provide our free open-source SEO diagnostics, measure audience traffic, and deliver personalized or non-personalized advertisements under EEA, UK, and Swiss GDPR data protection standards.
                  Read our <Link href="/privacy" style={{ color: 'var(--lv2-blue-light)', textDecoration: 'underline' }}>Privacy Policy</Link> for details.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRejectAll}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              aria-label="Close and use necessary cookies only"
            >
              <X size={18} />
            </button>
          </div>

          {/* 3 Choices: Consent, Do Not Consent, Manage Options */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="lv2-btn-ghost"
              onClick={() => { setShowModal(true); setShowBanner(false); }}
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem' }}
            >
              <Settings size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Manage Options
            </button>

            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleRejectAll}
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem' }}
            >
              Do Not Consent
            </button>

            <button
              type="button"
              className="check-btn"
              onClick={handleAcceptAll}
              style={{ padding: '0.5rem 1.35rem', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              <Check size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Consent &amp; Accept All
            </button>
          </div>
        </div>
      )}

      {/* ── Granular Manage Options Modal ── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manage Privacy & Cookie Preferences"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            zIndex: 100000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ShieldCheck size={24} color="var(--lv2-blue-light)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Consent Management Platform (CMP)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Customize your privacy preferences below. We respect your right to privacy in accordance with GDPR, UK GDPR, and Swiss FADP.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Strictly Necessary */}
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={15} color="#10B981" /> Strictly Necessary Cookies
                  </strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    Always Active
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Required for site navigation, theme preferences, and security token protection. Cannot be switched off.
                </p>
              </div>

              {/* Analytics & Performance */}
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9375rem' }}>Analytics &amp; Performance</strong>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Allows us to count visits and traffic sources to measure and improve our tool speeds and reliability.
                </p>
              </div>

              {/* Advertising & Marketing */}
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9375rem' }}>Advertising &amp; Google AdSense</strong>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Enables Google-certified advertising partners to store cookie tokens to serve relevant ads that keep this platform free.
                </p>
              </div>

              {/* Personalization */}
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9375rem' }}>Personalized Ad Experiences</strong>
                  <input
                    type="checkbox"
                    checked={preferences.personalization}
                    onChange={(e) => setPreferences({ ...preferences, personalization: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Allows Google AdSense to personalize ads based on past user search and browsing history.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="lv2-btn-ghost"
                onClick={handleRejectAll}
                style={{ fontSize: '0.8125rem' }}
              >
                Reject All
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={handleSavePreferences}
                  style={{ fontSize: '0.8125rem' }}
                >
                  Save Choices
                </button>
                <button
                  type="button"
                  className="check-btn"
                  onClick={handleAcceptAll}
                  style={{ fontSize: '0.8125rem' }}
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
