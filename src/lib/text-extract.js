import * as cheerio from 'cheerio';

// Common stopwords across English. Keep modest; users can disable.
export const STOPWORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at',
  'be','because','been','before','being','below','between','both','but','by',
  'can','cannot','could','couldn',
  'did','do','does','doing','don','down','during',
  'each','either','else',
  'few','for','from','further',
  'had','hadn','has','hasn','have','haven','having','he','her','here','hers','herself','him','himself','his','how',
  'i','if','in','into','is','isn','it','its','itself','i\'m','i\'ll','i\'ve','i\'d',
  'just',
  'll','let',
  'me','more','most','must','my','myself',
  'no','nor','not','now',
  'of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own',
  're',
  's','same','shall','she','should','shouldn','so','some','such',
  't','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','toward',
  'under','until','up','upon','us',
  've','very',
  'was','wasn','we','were','weren','what','when','where','which','while','who','whom','why','will','with','won','would','wouldn',
  'you','your','yours','yourself','yourselves',
]);

// Strip <script>, <style>, <noscript>, <template>, comments, and SVG before extracting visible text.
export function extractVisibleText(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, template, svg, iframe, head').remove();
  $('*').contents().each((_, el) => {
    if (el.type === 'comment') $(el).remove();
  });
  const title = ($('title').first().text() || '').trim();
  const bodyText = ($('body').text() || $.root().text() || '')
    .replace(/[\u00A0\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Get H1/H2/meta description for richer reporting
  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const description = $('meta[name="description"]').attr('content') || null;
  const lang = $('html').attr('lang') || null;
  return { title, bodyText, h1, h2, description, lang, htmlLength: html.length };
}

// Tokenise into normalised lowercase words, removing punctuation and short tokens.
export function tokenize(text, { minWordLength = 2, includeNumbers = false } = {}) {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[^\p{L}\p{N}'\-\s]/gu, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = cleaned.split(' ').filter((t) => {
    if (t.length < minWordLength) return false;
    if (!includeNumbers && /^[\d\-]+$/.test(t)) return false;
    return true;
  });
  return tokens;
}

export function countSyllables(word) {
  if (!word) return 0;
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const cleaned = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function countSentences(text) {
  if (!text) return 0;
  const m = text.match(/[^.!?]+[.!?]+/g);
  return m ? m.length : (text.trim() ? 1 : 0);
}

export function readingTimeMinutes(wordCount, wpm = 230) {
  return Math.max(1, Math.round(wordCount / wpm));
}

// Simple Flesch Reading Ease — higher is easier.
// 90-100 very easy; 60-70 plain English; 0-30 very confusing.
export function fleschReadingEase(words, sentences, syllables) {
  if (!words || !sentences) return null;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

export function fleschKincaidGrade(words, sentences, syllables) {
  if (!words || !sentences) return null;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}
