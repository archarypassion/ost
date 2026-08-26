"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Fingerprint, Copy, Check, ShieldCheck, Lock } from 'lucide-react';

// Lightweight pure JS MD5 fallback for complete coverage
function md5(string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | (~x & z); }
  function G(x, y, z) { return (x & z) | (y & ~z); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | ~z); }
  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(string) {
    let lWordCount;
    const lMessageLength = string.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue) {
    let WordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue += ('0' + lByte.toString(16)).slice(-2);
    }
    return WordToHexValue;
  }

  const x = convertToWordArray(unescape(encodeURIComponent(string)));
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a; const BB = b; const CC = c; const DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

async function computeSubtleHash(algorithm, text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashGeneratorPage() {
  const [text, setText] = useState('OpenSourceTools 2026');
  const [uppercase, setUppercase] = useState(false);
  const [hashes, setHashes] = useState({
    sha256: '',
    sha512: '',
    sha384: '',
    sha1: '',
    md5: '',
  });
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    let isCancelled = false;
    async function updateHashes() {
      if (!text) {
        setHashes({ sha256: '', sha512: '', sha384: '', sha1: '', md5: '' });
        return;
      }

      try {
        const [s256, s512, s384, s1] = await Promise.all([
          computeSubtleHash('SHA-256', text),
          computeSubtleHash('SHA-512', text),
          computeSubtleHash('SHA-384', text),
          computeSubtleHash('SHA-1', text),
        ]);

        if (!isCancelled) {
          setHashes({
            sha256: s256,
            sha512: s512,
            sha384: s384,
            sha1: s1,
            md5: md5(text),
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    updateHashes();
    return () => { isCancelled = true; };
  }, [text]);

  const handleCopy = async (key, val) => {
    if (!val) return;
    const finalVal = uppercase ? val.toUpperCase() : val;
    await navigator.clipboard.writeText(finalVal);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const hashList = [
    { key: 'sha256', name: 'SHA-256 (Secure Hash Algorithm 2)', bits: '256-bit', val: hashes.sha256, secure: true },
    { key: 'sha512', name: 'SHA-512 (High Entropy Digest)', bits: '512-bit', val: hashes.sha512, secure: true },
    { key: 'sha384', name: 'SHA-384 (Truncated 512)', bits: '384-bit', val: hashes.sha384, secure: true },
    { key: 'sha1', name: 'SHA-1 (Legacy Git Checksum)', bits: '160-bit', val: hashes.sha1, secure: false },
    { key: 'md5', name: 'MD5 (Message Digest 5)', bits: '128-bit', val: hashes.md5, secure: false },
  ];

  return (
    <div>
      <div className="tool-header">
        <h1>Cryptographic Hash Generator (SHA-256, SHA-512, MD5)</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Compute cryptographic checksums and message digests in real-time using native browser Web Crypto API.
          Supports SHA-256, SHA-512, SHA-384, SHA-1, and MD5 hashing algorithms.
        </p>

        {/* Input Textarea */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
            <label style={{ fontWeight: 600 }}>Input Plaintext / Data:</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
              <span>UPPERCASE HEX</span>
            </label>
          </div>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type text to compute cryptographic hashes..."
            className="search-input"
            style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.9375rem', lineHeight: 1.5 }}
          />
        </div>

        {/* Hashes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {hashList.map((h) => {
            const displayVal = uppercase ? h.val.toUpperCase() : h.val;
            return (
              <div
                key={h.key}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  borderLeft: h.secure ? '3px solid #10B981' : '3px solid #F59E0B',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.875rem' }}>{h.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({h.bits})</span>
                    {!h.secure && (
                      <span style={{ fontSize: '0.6875rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                        Non-cryptographic / Checksum only
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="lv2-pill-btn"
                    onClick={() => handleCopy(h.key, h.val)}
                    disabled={!h.val}
                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                  >
                    {copiedKey === h.key ? <Check size={11} color="#10B981" /> : <Copy size={11} />} {copiedKey === h.key ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', wordBreak: 'break-all', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  {displayVal || '<Empty>'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>The Cryptographic Mathematics of Message Digests</h2>
      <p>
        A cryptographic hash function is a one-way mathematical algorithm that maps arbitrary-length input data to a fixed-size bit string digest. Defined under <a href="https://csrc.nist.gov/publications/detail/fips/180-4/final" target="_blank" rel="noopener noreferrer">NIST FIPS 180-4</a>, secure hash functions guarantee three mathematical properties: <strong>Pre-image Resistance</strong> (one-way computation), <strong>Second Pre-image Resistance</strong> (tamper evidence), and <strong>Collision Resistance</strong> ($H(x) \neq H(y)$ for all $x \neq y$).
      </p>

      <h2>Core Hash Algorithms Compared</h2>

      <ul>
        <li><strong>SHA-256 (256 bits):</strong> The industry-standard secure hashing algorithm used in TLS certificates, Bitcoin blockchain consensus, and Subresource Integrity (SRI) web tags.</li>
        <li><strong>SHA-512 (512 bits):</strong> High-entropy variant of SHA-2, optimal for 64-bit CPU architectures and high-security key derivation.</li>
        <li><strong>SHA-1 (160 bits):</strong> Deprecated by NIST in 2011 due to theoretical collision attacks; still used in legacy Git commit identifiers.</li>
        <li><strong>MD5 (128 bits):</strong> Fast legacy checksum algorithm designed by Ron Rivest in 1991; broken for security but useful for cache busting and database file deduplication.</li>
      </ul>

      <h2>Subresource Integrity (SRI) for Web Security</h2>

      <p>
        Modern web browsers verify external CDN JavaScript files using SHA-256 / SHA-384 digests declared in the HTML <code>integrity</code> attribute:
      </p>
      <pre className="code-pre"><code>&lt;script src=&quot;https://cdn.example.com/lib.js&quot;
        integrity=&quot;sha256-aBcDeF123...&quot;
        crossorigin=&quot;anonymous&quot;&gt;&lt;/script&gt;</code></pre>

      <h2>Developer &amp; Security Tool Suite</h2>

      <p>
        Explore our companion developer utilities:
      </p>
      <ul>
        <li><strong>Base64 Data Conversion:</strong> Encode hash bytes with our <Link href="/tools/base64-encoder">Base64 Encoder / Decoder</Link>.</li>
        <li><strong>UUID Generation:</strong> Generate unique IDs with our <Link href="/tools/uuid-generator">UUID / GUID Generator</Link>.</li>
        <li><strong>Security Header Auditing:</strong> Inspect CSP hashes with our <Link href="/tools/security-headers">Security Headers Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Can a cryptographic hash be reverse-engineered or decrypted?</h3>
      <p>
        No. Cryptographic hash functions are mathematically one-way. It is computationally infeasible to recover the original plaintext from the digest without brute-force rainbow table dictionaries.
      </p>

      <h3>Is SHA-256 computed on your server?</h3>
      <p>
        No. All hashing is performed directly in your web browser using the native W3C Web Cryptography API (<code>crypto.subtle.digest</code>) for maximum speed and complete privacy.
      </p>
    </article>
  );
}
