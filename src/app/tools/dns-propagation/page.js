"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Network, CheckCircle, AlertTriangle, XCircle, Search, Globe, Clock } from 'lucide-react';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'];

export default function DnsPropagationPage() {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/tools/dns-propagation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, type: recordType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'DNS propagation check failed.');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Global DNS Propagation Checker</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Check whether recent DNS record changes have propagated across global DNS resolvers
          including Cloudflare, Google Public DNS, Quad9, Cisco OpenDNS, and AliDNS in real time.
        </p>

        <form onSubmit={handleSubmit} className="search-form" style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
          <div className="search-bar">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g., example.com)..."
              className="search-input"
              disabled={loading}
            />
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="search-input"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontWeight: 600, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button type="submit" className="check-btn" disabled={loading}>
              <Network size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Resolving...' : 'Check DNS'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>DNS Query Error: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Progress Card */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: data.isFullyPropagated ? '4px solid #10B981' : '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Domain &amp; Record Type
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                  {data.domain} <span style={{ color: 'var(--lv2-blue-light)' }}>({data.recordType})</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Global Propagation</span>
                <strong style={{ fontSize: '1.5rem', color: data.isFullyPropagated ? '#10B981' : '#F59E0B' }}>
                  {data.propagationPercent}%
                </strong>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${data.propagationPercent}%`,
                  height: '100%',
                  background: data.isFullyPropagated ? '#10B981' : 'linear-gradient(90deg, #F59E0B, #10B981)',
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* Worldwide Resolver Nodes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            {data.nodes.map((node, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  borderLeft: node.status === 'resolved' ? '3px solid #10B981' : '3px solid #EF4444',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>{node.resolver}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{node.location}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{node.elapsedMs}ms</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: node.status === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: node.status === 'resolved' ? '#10B981' : '#EF4444',
                      }}
                    >
                      {node.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Answers / Records */}
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono, monospace)' }}>
                  {node.answers && node.answers.length > 0 ? (
                    node.answers.map((ans, aIdx) => (
                      <div key={aIdx} style={{ wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                        {ans}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>{node.error || 'No records returned'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>The Mechanics of Global DNS Propagation</h2>
      <p>
        The Domain Name System (DNS) is a hierarchical, distributed naming database that translates human-readable hostnames (e.g. <code>example.com</code>) into machine-routable IP addresses (e.g. <code>93.184.216.34</code>). When DNS records are modified at your domain registrar, changes do not take effect globally instantly; they propagate across thousands of recursive DNS caching resolvers worldwide based on Time-To-Live (TTL) expiration schedules.
      </p>

      <h2>Key DNS Record Types Audited</h2>

      <ul>
        <li><strong>A Records (IPv4):</strong> Maps a domain to a 32-bit IPv4 address.</li>
        <li><strong>AAAA Records (IPv6):</strong> Maps a domain to a modern 128-bit IPv6 address.</li>
        <li><strong>MX Records (Mail Exchange):</strong> Routes inbound email traffic to authoritative mail servers.</li>
        <li><strong>CNAME Records (Canonical Name):</strong> Aliases one domain name to another fully qualified domain name.</li>
        <li><strong>TXT Records:</strong> Stores SPF verification, DKIM keys, and domain ownership tokens.</li>
      </ul>

      <h2>Strategies to Accelerate DNS Cutover &amp; Migration</h2>

      <ol>
        <li><strong>Lower TTL in Advance:</strong> 48 hours before a server migration, lower your DNS record TTL to <strong>300 seconds (5 minutes)</strong>. This forces worldwide resolvers to purge old cache entries almost immediately during the migration window.</li>
        <li><strong>Maintain Secondary IP Listeners:</strong> Keep old hosting servers proxying requests to the new server during the transition window to prevent downtime for users behind stubborn ISP caching resolvers.</li>
      </ol>

      <h2>Domain &amp; Infrastructure Diagnostics Suite</h2>

      <p>
        Perform comprehensive domain checks:
      </p>
      <ul>
        <li><strong>IP &amp; ASN Lookup:</strong> Map domain IP ownership with our <Link href="/tools/ip-lookup">IP Address Lookup</Link>.</li>
        <li><strong>Email Auth Auditing:</strong> Inspect DMARC &amp; SPF records with our <Link href="/tools/dmarc-checker">DMARC Validator</Link>.</li>
        <li><strong>SSL Handshake Verification:</strong> Inspect TLS certificate chains with our <Link href="/tools/ssl-checker">SSL Certificate Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why do different DNS resolvers show different IP addresses?</h3>
      <p>
        Recursive resolvers (like local ISP nameservers or public DNS providers) cache DNS records until their TTL expires. If a resolver has a cached record from 2 hours ago with a 4-hour TTL, it will not fetch the new IP until its local timer expires.
      </p>

      <h3>How long does global DNS propagation typically take?</h3>
      <p>
        With modern short TTL settings (300 to 3600 seconds), global propagation usually completes in under 1 hour. Legacy configurations with 86400-second TTLs can take up to 24 to 48 hours.
      </p>
    </article>
  );
}
