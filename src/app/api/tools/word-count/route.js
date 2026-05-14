import { logToolHistory } from '@/lib/mongodb';
import {
  ValidationError, normalizeUrl, fetchWithRedirects, readBoundedText,
  networkErrorToMessage,
} from '@/lib/fetch-helpers';
import {
  extractVisibleText, tokenize, countSyllables, countSentences,
  readingTimeMinutes, fleschReadingEase, fleschKincaidGrade,
} from '@/lib/text-extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;

function analyseText(text) {
  const tokens = tokenize(text, { minWordLength: 1, includeNumbers: true });
  const wordCount = tokens.length;
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (text.trim() ? 1 : 0);
  const sentences = countSentences(text);

  let syllables = 0;
  let longWords = 0; // 7+ chars
  let veryLongWords = 0; // 12+ chars
  for (const t of tokens) {
    syllables += countSyllables(t);
    if (t.length >= 7) longWords++;
    if (t.length >= 12) veryLongWords++;
  }

  const avgWordLength = wordCount > 0 ? +(tokens.reduce((s, t) => s + t.length, 0) / wordCount).toFixed(2) : 0;
  const avgSentenceLength = sentences > 0 ? +(wordCount / sentences).toFixed(2) : 0;
  const flesch = wordCount && sentences ? +fleschReadingEase(wordCount, sentences, syllables).toFixed(1) : null;
  const fkGrade = wordCount && sentences ? +fleschKincaidGrade(wordCount, sentences, syllables).toFixed(1) : null;

  return {
    words: wordCount,
    characters: charCount,
    charactersNoSpaces: charNoSpaces,
    sentences,
    paragraphs,
    syllables,
    longWords,
    veryLongWords,
    avgWordLength,
    avgSentenceLength,
    readingTimeMinutes: readingTimeMinutes(wordCount, 230),
    speakingTimeMinutes: readingTimeMinutes(wordCount, 130),
    fleschReadingEase: flesch,
    fleschKincaidGrade: fkGrade,
    readabilityLabel: flesch === null ? null : fleschLabel(flesch),
  };
}

function fleschLabel(score) {
  if (score >= 90) return 'Very easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly easy (7th grade)';
  if (score >= 60) return 'Standard (8th–9th grade)';
  if (score >= 50) return 'Fairly difficult (10th–12th grade)';
  if (score >= 30) return 'Difficult (college)';
  return 'Very difficult (college graduate)';
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const mode = body?.mode === 'text' ? 'text' : 'url';

  if (mode === 'text') {
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text.trim()) return Response.json({ error: 'Please provide some text.' }, { status: 400 });
    const stats = analyseText(text);
    return Response.json({ mode: 'text', stats });
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
      return Response.json({
        url, finalUrl, httpStatus: res.status, contentType,
        error: `Server returned HTTP ${res.status}.`,
        redirectChain: chain,
      }, { status: 502 });
    }
    if (!isHtml) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({
        url, finalUrl, httpStatus: res.status, contentType,
        error: `Content-Type is "${contentType || 'unknown'}" — this tool only works on HTML pages.`,
        redirectChain: chain,
      }, { status: 400 });
    }

    const html = await readBoundedText(res);
    const extracted = extractVisibleText(html);
    const stats = analyseText(extracted.bodyText);

    const result = {
      mode: 'url',
      url, finalUrl, httpStatus: res.status, contentType,
      redirectChain: chain,
      extracted: {
        title: extracted.title,
        description: extracted.description,
        h1Count: extracted.h1.length,
        h2Count: extracted.h2.length,
        firstH1: extracted.h1[0] || null,
        lang: extracted.lang,
        htmlLength: extracted.htmlLength,
      },
      stats,
    };
    void logToolHistory({ url, toolName: 'Word Count Checker', result });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    const mapped = networkErrorToMessage(err);
    if (mapped) return Response.json({ error: mapped.error }, { status: mapped.status });
    console.error('[word-count] error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
