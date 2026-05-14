import { logToolHistory } from '@/lib/mongodb';
import {
  ValidationError, normalizeUrl, fetchWithRedirects, readBoundedText, networkErrorToMessage,
} from '@/lib/fetch-helpers';
import { extractVisibleText, tokenize, STOPWORDS } from '@/lib/text-extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_TOP = 50;

function topNgrams(tokens, n, top, excludeStop) {
  const counts = new Map();
  for (let i = 0; i + n <= tokens.length; i++) {
    const slice = tokens.slice(i, i + n);
    if (excludeStop && slice.some((t) => STOPWORDS.has(t))) continue;
    const key = slice.join(' ');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = [...counts.values()].reduce((s, v) => s + v, 0) || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([term, count]) => ({ term, count, density: +((count / total) * 100).toFixed(2) }));
}

function analyseText(text, opts) {
  const top = Math.min(MAX_TOP, Math.max(5, opts.top || 20));
  const excludeStop = opts.excludeStopwords !== false;
  const tokens = tokenize(text, { minWordLength: 2 });
  const totalWords = tokens.length;

  const filtered = excludeStop ? tokens.filter((t) => !STOPWORDS.has(t)) : tokens.slice();
  const totalConsidered = filtered.length;

  const wordCounts = new Map();
  for (const t of filtered) wordCounts.set(t, (wordCounts.get(t) || 0) + 1);
  const unigrams = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([term, count]) => ({ term, count, density: totalConsidered ? +((count / totalConsidered) * 100).toFixed(2) : 0 }));

  // For n-grams, use original token stream (so phrases stay natural) but exclude
  // any n-gram that contains a stopword to surface meaningful phrases.
  const bigrams = topNgrams(tokens, 2, top, excludeStop);
  const trigrams = topNgrams(tokens, 3, top, excludeStop);

  const uniqueWords = wordCounts.size;
  const lexicalDiversity = totalConsidered ? +(uniqueWords / totalConsidered).toFixed(3) : 0;

  return {
    totalWords,
    totalConsidered,
    uniqueWords,
    lexicalDiversity,
    excludeStopwords: excludeStop,
    unigrams,
    bigrams,
    trigrams,
  };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const mode = body?.mode === 'text' ? 'text' : 'url';
  const opts = {
    top: typeof body?.top === 'number' ? body.top : 20,
    excludeStopwords: body?.excludeStopwords !== false,
  };

  if (mode === 'text') {
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text.trim()) return Response.json({ error: 'Please provide some text.' }, { status: 400 });
    return Response.json({ mode: 'text', stats: analyseText(text, opts) });
  }

  let url;
  try { url = normalizeUrl(body?.url); }
  catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(url, ctrl.signal);
    const contentType = res.headers.get('content-type') || '';
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);
    if (res.status >= 400) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({ url, finalUrl, httpStatus: res.status, contentType, error: `Server returned HTTP ${res.status}.`, redirectChain: chain }, { status: 502 });
    }
    if (!isHtml) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({ url, finalUrl, httpStatus: res.status, contentType, error: `Content-Type is "${contentType || 'unknown'}" — this tool only works on HTML pages.`, redirectChain: chain }, { status: 400 });
    }
    const html = await readBoundedText(res);
    const extracted = extractVisibleText(html);
    const stats = analyseText(extracted.bodyText, opts);

    const result = {
      mode: 'url',
      url, finalUrl, httpStatus: res.status, contentType,
      redirectChain: chain,
      title: extracted.title,
      h1: extracted.h1,
      h2Count: extracted.h2.length,
      lang: extracted.lang,
      stats,
    };
    void logToolHistory({ url, toolName: 'Keyword Density Checker', result });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    const m = networkErrorToMessage(err);
    if (m) return Response.json({ error: m.error }, { status: m.status });
    console.error('[keyword-density] error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
