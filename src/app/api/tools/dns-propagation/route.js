import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOH_RESOLVERS = [
  { id: 'cloudflare', name: 'Cloudflare DNS (1.1.1.1)', location: 'Global / North America', url: 'https://cloudflare-dns.com/dns-query' },
  { id: 'google', name: 'Google Public DNS (8.8.8.8)', location: 'United States', url: 'https://dns.google/resolve' },
  { id: 'quad9', name: 'Quad9 Security (9.9.9.9)', location: 'Switzerland / Europe', url: 'https://dns.quad9.net/dns-query' },
  { id: 'opendns', name: 'Cisco OpenDNS (208.67.222.222)', location: 'United States', url: 'https://doh.opendns.com/dns-query' },
  { id: 'alidns', name: 'Alibaba AliDNS (223.5.5.5)', location: 'Asia-Pacific', url: 'https://dns.alidns.com/resolve' },
  { id: 'nextdns', name: 'NextDNS Network', location: 'Europe', url: 'https://dns.nextdns.io/dns-query' },
];

function cleanDomain(input) {
  let d = (input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return d.split('/')[0].split('?')[0].split('#')[0];
}

async function queryDoh(resolver, name, type, signal) {
  const startedAt = Date.now();
  try {
    const u = new URL(resolver.url);
    u.searchParams.set('name', name);
    u.searchParams.set('type', type);

    const res = await fetch(u.toString(), {
      headers: { Accept: 'application/dns-json' },
      signal,
    });

    const elapsedMs = Date.now() - startedAt;
    if (!res.ok) {
      return { resolver: resolver.name, location: resolver.location, status: 'error', elapsedMs, answers: [], error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const answers = (data.Answer || []).map((a) => a.data || a.data_raw || String(a));
    const status = data.Status === 0 ? (answers.length > 0 ? 'resolved' : 'no-data') : 'nxdomain';

    return {
      resolver: resolver.name,
      location: resolver.location,
      status,
      elapsedMs,
      statusCode: data.Status,
      answers,
    };
  } catch (err) {
    return {
      resolver: resolver.name,
      location: resolver.location,
      status: 'error',
      elapsedMs: Date.now() - startedAt,
      answers: [],
      error: err.message || 'Timeout',
    };
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const domain = cleanDomain(body?.domain || body?.url || '');
  if (!domain || !domain.includes('.')) {
    return Response.json({ error: 'Please enter a valid domain (e.g. example.com).' }, { status: 400 });
  }

  const recordType = (body?.type || 'A').toUpperCase();
  const validTypes = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS', 'SOA'];
  if (!validTypes.includes(recordType)) {
    return Response.json({ error: `Unsupported record type: ${recordType}` }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    const results = await Promise.all(
      DOH_RESOLVERS.map((r) => queryDoh(r, domain, recordType, ctrl.signal))
    );

    const resolvedNodes = results.filter((r) => r.status === 'resolved');
    const propagationPercent = Math.round((resolvedNodes.length / DOH_RESOLVERS.length) * 100);

    const result = {
      domain,
      recordType,
      nodesQueried: DOH_RESOLVERS.length,
      nodesResolved: resolvedNodes.length,
      propagationPercent,
      isFullyPropagated: propagationPercent === 100,
      nodes: results,
    };

    void logToolHistory({ url: domain, toolName: 'DNS Global Propagation Checker', result });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message || 'DNS propagation query failed.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
