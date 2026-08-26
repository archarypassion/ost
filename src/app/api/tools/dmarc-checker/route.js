import dns from 'node:dns/promises';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanDomain(input) {
  let d = (input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  d = d.split('/')[0].split('?')[0].split('#')[0];
  if (d.includes('@')) d = d.split('@')[1];
  return d;
}

function parseDmarc(recordStr) {
  const tags = {};
  const parts = recordStr.split(';').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const val = part.slice(eqIdx + 1).trim();
      tags[key] = val;
    }
  }
  return tags;
}

function parseSpf(recordStr) {
  const parts = recordStr.split(/\s+/).map((p) => p.trim()).filter(Boolean);
  const mechanisms = [];
  const modifiers = [];
  let allPolicy = null;

  for (const part of parts) {
    if (part.toLowerCase() === 'v=spf1') continue;
    if (part.includes('=')) {
      modifiers.push(part);
    } else if (/^[~+\-?]all$/i.test(part)) {
      allPolicy = part.toLowerCase();
    } else {
      mechanisms.push(part);
    }
  }

  return { mechanisms, modifiers, allPolicy };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }

  const domain = cleanDomain(body?.domain || body?.url || '');
  if (!domain || !domain.includes('.') || domain.length < 3) {
    return Response.json({ error: 'Please enter a valid domain name (e.g. example.com).' }, { status: 400 });
  }

  const dmarcHost = `_dmarc.${domain}`;
  let dmarcRecord = null;
  let dmarcTags = null;
  let dmarcError = null;

  try {
    const dmarcTxts = await dns.resolveTxt(dmarcHost);
    const flattened = dmarcTxts.map((chunks) => chunks.join(''));
    const matched = flattened.find((txt) => txt.toLowerCase().startsWith('v=dmarc1'));
    if (matched) {
      dmarcRecord = matched;
      dmarcTags = parseDmarc(matched);
    } else {
      dmarcError = 'No valid v=DMARC1 record found at _dmarc.' + domain;
    }
  } catch (err) {
    dmarcError = err.code === 'ENOTFOUND' || err.code === 'ENODATA'
      ? `No DMARC TXT record published at _dmarc.${domain}.`
      : `DNS lookup failed for _dmarc.${domain}: ${err.message}`;
  }

  let spfRecord = null;
  let spfParsed = null;
  let spfError = null;

  try {
    const domainTxts = await dns.resolveTxt(domain);
    const flattened = domainTxts.map((chunks) => chunks.join(''));
    const matched = flattened.find((txt) => txt.toLowerCase().startsWith('v=spf1'));
    if (matched) {
      spfRecord = matched;
      spfParsed = parseSpf(matched);
    } else {
      spfError = 'No valid v=spf1 record published on apex domain.';
    }
  } catch (err) {
    spfError = err.code === 'ENOTFOUND' || err.code === 'ENODATA'
      ? `No SPF record found on apex ${domain}.`
      : `DNS lookup failed for ${domain}: ${err.message}`;
  }

  // Evaluate DMARC health & score
  let score = 0;
  const warnings = [];
  const findings = [];

  if (dmarcRecord && dmarcTags) {
    score += 40;
    const policy = (dmarcTags.p || '').toLowerCase();
    if (policy === 'reject') {
      score += 20;
      findings.push({ level: 'good', text: 'DMARC Policy is set to "reject" (Maximum spoofing protection).' });
    } else if (policy === 'quarantine') {
      score += 15;
      findings.push({ level: 'good', text: 'DMARC Policy is set to "quarantine" (Failing emails sent to Spam/Junk).' });
    } else if (policy === 'none') {
      score += 5;
      warnings.push('DMARC policy is set to "none" (Monitoring only). Spoofed emails will still be delivered to inboxes.');
      findings.push({ level: 'warning', text: 'Policy p=none — monitoring mode, no enforcement.' });
    } else {
      warnings.push('Missing or invalid "p=" policy tag in DMARC record.');
    }

    if (dmarcTags.rua) {
      score += 10;
      findings.push({ level: 'good', text: `Aggregate reports configured (rua=${dmarcTags.rua}).` });
    } else {
      warnings.push('Missing aggregate reporting URI (rua tag). You will not receive XML deliverability reports.');
    }
  } else {
    warnings.push('Domain is missing a DMARC policy. Anyone on the internet can spoof emails from this domain.');
  }

  if (spfRecord && spfParsed) {
    score += 20;
    if (spfParsed.allPolicy === '-all') {
      score += 10;
      findings.push({ level: 'good', text: 'SPF HardFail (-all) active. Strict sender verification enforced.' });
    } else if (spfParsed.allPolicy === '~all') {
      score += 8;
      findings.push({ level: 'good', text: 'SPF SoftFail (~all) active. Standard industry configuration.' });
    } else if (spfParsed.allPolicy === '+all') {
      warnings.push('SPF uses "+all", which explicitly permits the entire internet to send email on your behalf!');
      score -= 20;
    } else if (spfParsed.allPolicy === '?all') {
      warnings.push('SPF uses "?all" (neutral), which disables sender authentication enforcement.');
    }
  } else {
    warnings.push('Missing SPF record. Outbound emails may be marked as spam by Gmail, Outlook and Yahoo.');
  }

  score = Math.max(0, Math.min(100, score));
  let status = 'critical';
  if (score >= 80) status = 'good';
  else if (score >= 50) status = 'warning';

  const result = {
    domain,
    score,
    status,
    dmarc: {
      host: dmarcHost,
      record: dmarcRecord,
      tags: dmarcTags,
      error: dmarcError,
    },
    spf: {
      host: domain,
      record: spfRecord,
      parsed: spfParsed,
      error: spfError,
    },
    findings,
    warnings,
  };

  void logToolHistory({ url: domain, toolName: 'DMARC & SPF Validator', result });
  return Response.json(result);
}
