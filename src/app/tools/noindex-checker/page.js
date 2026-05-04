"use client";

import { useState } from 'react';
import NoindexArticle from './NoindexArticle';

export default function NoindexChecker() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/tools/noindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setStatus({ error: 'Failed to process request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Noindex Tag Checker</h1>
      </div>
      
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input 
            type="url" 
            placeholder="Enter website URL..." 
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Checking...' : 'Check'}
          </button>
        </form>
        <p className="tool-description">
          Check your website to determine if the robots meta tag is being used to block indexing by search engines.
        </p>

        {status && (
          <div style={{ marginTop: '2rem', width: '100%', maxWidth: '800px', backgroundColor: '#1C1C1F', padding: '1.5rem', borderRadius: '8px', border: '1px solid #3F3F46' }}>
            <h3 style={{ marginBottom: '1rem', color: '#FFFFFF' }}>Results for: {status.url || url}</h3>
            {status.error ? (
              <p style={{ color: '#EF4444' }}>{status.error}</p>
            ) : (
              <div>
                <p style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A1A1AA' }}>Status:</span> 
                  <span style={{ color: status.hasNoindex ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                    {status.hasNoindex ? 'Noindex Found' : 'Indexable'}
                  </span>
                </p>
                <p style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A1A1AA' }}>Robots Meta Tag:</span> 
                  <span style={{ color: '#FFFFFF' }}>{status.robotsContent || 'Not Present'}</span>
                </p>
                <p style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A1A1AA' }}>X-Robots-Tag Header:</span> 
                  <span style={{ color: '#FFFFFF' }}>{status.xRobotsTag || 'Not Present'}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <NoindexArticle />
      </div>
    </div>
  );
}
