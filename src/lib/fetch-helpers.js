// Shared HTTP fetch helpers used by every tool route.
// Centralises SSRF protection, redirect handling, body limits, and charset decoding.

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const DEFAULT_USER_AGENT = 'Tool4Utility-Bot/1.0 (+https://tool4utility.com)';
export const DEFAULT_MAX_BODY_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_REDIRECTS = 5;

export function isPrivateHost(host) {
  if (!host) return true;
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '0.0.0.0' || h === '169.254.169.254') return true;
  if (h === '[::1]' || h === '::1') return true;
  if (/^\[?fc[0-9a-f]{2}:/i.test(h)) return true;
  if (/^\[?fe80:/i.test(h)) return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  return false;
}

export function normalizeUrl(input, { allowedProtocols = ['http:', 'https:'] } = {}) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('Please provide a URL.');
  }
  let raw = input.trim();
  if (!/^[a-z]+:\/\//i.test(raw)) raw = 'https://' + raw;
  let parsed;
  try { parsed = new URL(raw); }
  catch { throw new ValidationError('That doesn’t look like a valid URL.'); }
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new ValidationError(`Only ${allowedProtocols.join(', ')} URLs are supported.`);
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new ValidationError('Private, loopback, and link-local hosts are blocked.');
  }
  return parsed.toString();
}

export function normalizeDomain(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('Please provide a domain.');
  }
  let raw = input.trim().toLowerCase();
  raw = raw.replace(/^https?:\/\//, '');
  raw = raw.split('/')[0].split(':')[0];
  if (!raw || !/^[a-z0-9.-]+$/i.test(raw) || !raw.includes('.')) {
    throw new ValidationError('That doesn’t look like a valid domain.');
  }
  if (isPrivateHost(raw)) {
    throw new ValidationError('Private, loopback, and link-local hosts are blocked.');
  }
  return raw;
}

export async function fetchWithRedirects(initialUrl, signal, opts = {}) {
  const {
    method = 'GET',
    headers: extraHeaders = {},
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    userAgent = DEFAULT_USER_AGENT,
    accept = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
  } = opts;

  const chain = [];
  let currentUrl = initialUrl;
  for (let i = 0; i <= maxRedirects; i++) {
    const startedAt = Date.now();
    const res = await fetch(currentUrl, {
      method,
      redirect: 'manual',
      signal,
      headers: { 'User-Agent': userAgent, Accept: accept, ...extraHeaders },
    });
    const elapsedMs = Date.now() - startedAt;
    chain.push({
      url: currentUrl,
      status: res.status,
      statusText: res.statusText,
      location: res.headers.get('location'),
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'),
      contentEncoding: res.headers.get('content-encoding'),
      server: res.headers.get('server'),
      elapsedMs,
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return { res, chain, finalUrl: currentUrl };
      if (i === maxRedirects) throw new ValidationError('Too many redirects.');
      let nextUrl;
      try { nextUrl = new URL(location, currentUrl).toString(); }
      catch { throw new ValidationError('Invalid redirect URL.'); }
      const nextHost = new URL(nextUrl).hostname;
      if (isPrivateHost(nextHost)) throw new ValidationError('Redirect target blocked.');
      try { await res.body?.cancel(); } catch {}
      currentUrl = nextUrl;
      continue;
    }
    return { res, chain, finalUrl: currentUrl };
  }
  throw new ValidationError('Too many redirects.');
}

export async function readBoundedBytes(response, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      try { await reader.cancel(); } catch {}
      break;
    }
    chunks.push(value);
  }
  const total = received > maxBytes ? maxBytes : received;
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset + chunk.byteLength > total) {
      merged.set(chunk.subarray(0, total - offset), offset);
      break;
    }
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export async function readBoundedText(response, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const bytes = await readBoundedBytes(response, maxBytes);
  const charset = (response.headers.get('content-type') || '').toLowerCase().match(/charset=([^;]+)/);
  const encoding = charset ? charset[1].trim() : 'utf-8';
  try { return new TextDecoder(encoding, { fatal: false }).decode(bytes); }
  catch { return new TextDecoder('utf-8', { fatal: false }).decode(bytes); }
}

export function networkErrorToMessage(err) {
  if (err?.name === 'AbortError') return { error: 'Request timed out.', status: 504 };
  if (err?.cause?.code === 'ENOTFOUND' || err?.code === 'ENOTFOUND') return { error: 'Could not resolve that domain (DNS lookup failed).', status: 502 };
  if (err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED') return { error: 'Connection refused.', status: 502 };
  if (err?.cause?.code === 'CERT_HAS_EXPIRED') return { error: 'The site’s SSL certificate has expired.', status: 502 };
  if (err?.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') return { error: 'The site’s SSL certificate could not be verified.', status: 502 };
  if (err?.cause?.code === 'SELF_SIGNED_CERT_IN_CHAIN') return { error: 'The site uses a self-signed SSL certificate.', status: 502 };
  if (err?.cause?.code === 'EPROTO') return { error: 'TLS protocol error connecting to the site.', status: 502 };
  return null;
}
