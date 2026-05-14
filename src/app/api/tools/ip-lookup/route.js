import dns from 'node:dns/promises';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeDomain, isPrivateHost } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEO_TIMEOUT_MS = 5_000;
const RESOLVER_TIMEOUT_MS = 5_000;
const IP_RE = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/;

function isIp(input) { return IP_RE.test(input); }

async function safeResolve(name, type) {
  try {
    const fn = type === 'CNAME' ? dns.resolveCname
      : type === 'A' ? dns.resolve4
      : type === 'AAAA' ? dns.resolve6
      : type === 'MX' ? dns.resolveMx
      : type === 'NS' ? dns.resolveNs
      : type === 'TXT' ? dns.resolveTxt
      : type === 'SOA' ? dns.resolveSoa
      : type === 'CAA' ? dns.resolveCaa
      : null;
    if (!fn) return [];
    const records = await Promise.race([
      fn(name),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), RESOLVER_TIMEOUT_MS)),
    ]);
    if (type === 'TXT' && Array.isArray(records)) {
      return records.map((r) => Array.isArray(r) ? r.join('') : r);
    }
    return records || [];
  } catch (err) {
    return { error: err?.code || err?.message || 'lookup failed' };
  }
}

async function geolocate(ip) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'TrueSEO-IPLookup/1.0' },
    });
    if (!res.ok) return { error: `geo lookup failed: HTTP ${res.status}` };
    const data = await res.json();
    if (data?.error) return { error: data?.reason || data?.error || 'geo lookup failed' };
    return {
      ip: data.ip || ip,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      continent: data.continent_code || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      timezone: data.timezone || null,
      utcOffset: data.utc_offset || null,
      asn: data.asn || null,
      org: data.org || null,
      postal: data.postal || null,
      currency: data.currency || null,
    };
  } catch (err) {
    return { error: err?.name === 'AbortError' ? 'geo lookup timed out' : (err?.message || 'geo lookup failed') };
  } finally {
    clearTimeout(timer);
  }
}

async function reverseLookup(ip) {
  try {
    const names = await Promise.race([
      dns.reverse(ip),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), RESOLVER_TIMEOUT_MS)),
    ]);
    return names || [];
  } catch (err) {
    return { error: err?.code || err?.message || 'reverse lookup failed' };
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const inputRaw = (body?.url || body?.domain || body?.ip || '').toString().trim();
  if (!inputRaw) return Response.json({ error: 'Please provide a domain or IP.' }, { status: 400 });

  let target = inputRaw.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();

  // Branch: IP address vs domain name
  if (isIp(target)) {
    if (isPrivateHost(target)) return Response.json({ error: 'Private IPs cannot be looked up.' }, { status: 400 });
    const [ptr, geo] = await Promise.all([reverseLookup(target), geolocate(target)]);
    const result = {
      mode: 'ip',
      input: inputRaw,
      ip: target,
      reverseDns: Array.isArray(ptr) ? ptr : [],
      reverseDnsError: ptr?.error || null,
      geo: geo?.error ? null : geo,
      geoError: geo?.error || null,
    };
    void logToolHistory({ url: target, toolName: 'IP Lookup', result });
    return Response.json(result);
  }

  // Domain mode
  let domain;
  try { domain = normalizeDomain(target); }
  catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const [a, aaaa, mx, ns, txt, soa, caa, cname] = await Promise.all([
    safeResolve(domain, 'A'),
    safeResolve(domain, 'AAAA'),
    safeResolve(domain, 'MX'),
    safeResolve(domain, 'NS'),
    safeResolve(domain, 'TXT'),
    safeResolve(domain, 'SOA'),
    safeResolve(domain, 'CAA'),
    safeResolve(domain, 'CNAME'),
  ]);

  const ips = [];
  if (Array.isArray(a)) ips.push(...a);
  if (Array.isArray(aaaa)) ips.push(...aaaa);

  const enriched = await Promise.all(ips.slice(0, 5).map(async (ip) => {
    const [ptr, geo] = await Promise.all([reverseLookup(ip), geolocate(ip)]);
    return {
      ip,
      reverseDns: Array.isArray(ptr) ? ptr : [],
      reverseDnsError: ptr?.error || null,
      geo: geo?.error ? null : geo,
      geoError: geo?.error || null,
    };
  }));

  const result = {
    mode: 'domain',
    input: inputRaw,
    domain,
    a, aaaa, mx, ns, txt, soa, caa, cname,
    ips: enriched,
    counts: {
      a: Array.isArray(a) ? a.length : 0,
      aaaa: Array.isArray(aaaa) ? aaaa.length : 0,
      mx: Array.isArray(mx) ? mx.length : 0,
      ns: Array.isArray(ns) ? ns.length : 0,
      txt: Array.isArray(txt) ? txt.length : 0,
    },
  };

  void logToolHistory({ url: domain, toolName: 'IP Lookup', result });
  return Response.json(result);
}
