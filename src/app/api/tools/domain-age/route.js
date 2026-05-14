import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeDomain } from '@/lib/fetch-helpers';
import { lookupWhois } from '@/lib/whois';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildIssues(w) {
  const issues = [];
  if (!w.creationDate) issues.push({ severity: 'warn', message: 'WHOIS did not include a creation date — may be GDPR-redacted or use an unusual format.' });
  if (!w.expirationDate) issues.push({ severity: 'info', message: 'No expiration date returned (privacy redaction is increasingly common).' });
  if (w.daysUntilExpiry !== undefined) {
    if (w.daysUntilExpiry < 0) issues.push({ severity: 'fail', message: `Domain expired ${Math.abs(w.daysUntilExpiry)} days ago.` });
    else if (w.daysUntilExpiry <= 30) issues.push({ severity: 'fail', message: `Domain expires in ${w.daysUntilExpiry} day${w.daysUntilExpiry === 1 ? '' : 's'} — renew now.` });
    else if (w.daysUntilExpiry <= 90) issues.push({ severity: 'warn', message: `Domain expires in ${w.daysUntilExpiry} days — schedule renewal.` });
    else issues.push({ severity: 'pass', message: `Domain valid for another ${w.daysUntilExpiry} days.` });
  }
  if (w.ageYears !== undefined) {
    if (w.ageYears >= 5) issues.push({ severity: 'pass', message: `Domain is ${w.ageYears} years old — established history is a positive trust signal.` });
    else if (w.ageYears >= 1) issues.push({ severity: 'info', message: `Domain is ${w.ageYears} years old.` });
    else issues.push({ severity: 'warn', message: `Domain is only ${w.ageYears} year${w.ageYears < 1 ? '' : 's'} old — newer domains have less established trust.` });
  }
  const statuses = (w.statuses || []).map((s) => s.toLowerCase());
  if (statuses.some((s) => s.includes('clienthold') || s.includes('serverhold'))) {
    issues.push({ severity: 'fail', message: 'Domain is on Hold — it will not resolve.' });
  }
  if (statuses.some((s) => s.includes('pendingdelete'))) {
    issues.push({ severity: 'fail', message: 'Domain is in pendingDelete — it will be released soon.' });
  }
  if (issues.length === 0) issues.push({ severity: 'pass', message: 'WHOIS data looks healthy.' });
  return issues;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  let domain;
  try { domain = normalizeDomain(body?.domain || body?.url); }
  catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }

  try {
    const w = await lookupWhois(domain);
    if (w.error) return Response.json({ domain, error: w.error }, { status: 502 });
    const issues = buildIssues(w);
    const result = {
      domain: w.domain,
      whoisServer: w.server,
      creationDate: w.creationDate || null,
      creationDateIso: w.creationDateIso || null,
      expirationDate: w.expirationDate || null,
      expirationDateIso: w.expirationDateIso || null,
      updatedDate: w.updatedDate || null,
      updatedDateIso: w.updatedDateIso || null,
      ageDays: w.ageDays ?? null,
      ageYears: w.ageYears ?? null,
      daysUntilExpiry: w.daysUntilExpiry ?? null,
      registrar: w.registrar || null,
      registrarUrl: w.registrarUrl || null,
      registrarIanaId: w.registrarIanaId || null,
      abuseEmail: w.abuseEmail || null,
      registrant: w.registrant || {},
      statuses: w.statuses || [],
      nameServers: w.nameServers || [],
      raw: w.raw,
      issues,
      summary: {
        pass: issues.filter((i) => i.severity === 'pass').length,
        warn: issues.filter((i) => i.severity === 'warn').length,
        fail: issues.filter((i) => i.severity === 'fail').length,
      },
    };
    void logToolHistory({ url: domain, toolName: 'Domain Age Checker', result });
    return Response.json(result);
  } catch (err) {
    console.error('[domain-age] error:', err);
    return Response.json({ error: err?.message || 'WHOIS lookup failed.' }, { status: 502 });
  }
}
