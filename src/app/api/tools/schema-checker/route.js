import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const USER_AGENT = 'OpenSourceTools-SchemaChecker/1.0 (+https://www.opensourcetools.online)';

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isPrivateHost(host) {
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

function normalizeUrl(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('Please provide a URL.');
  }
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let parsed;
  try { parsed = new URL(raw); }
  catch { throw new ValidationError('That doesn’t look like a valid URL.'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError('Only http:// and https:// URLs are supported.');
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new ValidationError('Private, loopback, and link-local hosts are blocked.');
  }
  return parsed.toString();
}

async function fetchWithRedirects(initialUrl, signal) {
  const chain = [];
  let currentUrl = initialUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' },
    });
    chain.push({ url: currentUrl, status: res.status });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return { res, chain, finalUrl: currentUrl };
      if (i === MAX_REDIRECTS) throw new ValidationError('Too many redirects.');
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

async function readBoundedText(response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      try { await reader.cancel(); } catch {}
      break;
    }
    chunks.push(value);
  }
  const total = received > MAX_BODY_BYTES ? MAX_BODY_BYTES : received;
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
  const charset = (response.headers.get('content-type') || '').toLowerCase().match(/charset=([^;]+)/);
  const encoding = charset ? charset[1].trim() : 'utf-8';
  try { return new TextDecoder(encoding, { fatal: false }).decode(merged); }
  catch { return new TextDecoder('utf-8', { fatal: false }).decode(merged); }
}

// ─── JSON-LD extraction ───────────────────────────────────────────────────

function extractJsonLd($) {
  const blocks = [];
  $('script[type="application/ld+json"]').each((idx, el) => {
    const raw = $(el).text() || $(el).html() || '';
    const trimmed = raw.trim();
    if (!trimmed) {
      blocks.push({ index: idx, raw, parseError: 'Empty <script> block.' });
      return;
    }
    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      // Try to recover from common issues: trailing commas, HTML comments, leading/trailing junk
      const cleaned = trimmed
        .replace(/^\uFEFF/, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/,(\s*[}\]])/g, '$1');
      try {
        parsed = JSON.parse(cleaned);
      } catch (err2) {
        parseError = err.message;
      }
    }
    blocks.push({ index: idx, raw: trimmed, parsed, parseError });
  });
  return blocks;
}

// Walk @graph and nested arrays/objects to collect all items with @type.
// Inherits @context from ancestors when not declared on the item itself.
function collectItems(parsed, path = [], inheritedContext = null) {
  const items = [];
  if (parsed === null || parsed === undefined) return items;

  if (Array.isArray(parsed)) {
    parsed.forEach((entry, i) => {
      items.push(...collectItems(entry, [...path, i], inheritedContext));
    });
    return items;
  }
  if (typeof parsed !== 'object') return items;

  const localContext = parsed['@context'] || null;
  const effectiveContext = localContext || inheritedContext;

  if (Array.isArray(parsed['@graph'])) {
    parsed['@graph'].forEach((entry, i) => {
      items.push(...collectItems(entry, [...path, '@graph', i], effectiveContext));
    });
  }

  if (parsed['@type']) {
    items.push({
      types: normalizeTypes(parsed['@type']),
      data: parsed,
      effectiveContext,
      path: path.length ? path.join('.') : 'root',
    });
  }
  return items;
}

function normalizeTypes(t) {
  if (Array.isArray(t)) return t.map(String);
  if (typeof t === 'string') return [t];
  return [];
}

function stripContext(typeName) {
  if (!typeName) return '';
  return String(typeName).replace(/^https?:\/\/schema\.org\//, '').replace(/^schema:/, '');
}

// ─── Validators per Google rich-result type ───────────────────────────────
// Severity: 'fail' = required missing → not eligible for rich result
//           'warn' = recommended missing → may be eligible but reduced
//           'info' = best-practice note

const VALIDATORS = {
  Article: validateArticle,
  NewsArticle: validateArticle,
  BlogPosting: validateArticle,
  Report: validateArticle,
  AnalysisNewsArticle: validateArticle,
  OpinionNewsArticle: validateArticle,
  ReportageNewsArticle: validateArticle,
  Product: validateProduct,
  IndividualProduct: validateProduct,
  ProductModel: validateProduct,
  FAQPage: validateFAQPage,
  QAPage: validateFAQPage,
  HowTo: validateHowTo,
  Recipe: validateRecipe,
  Event: validateEvent,
  BusinessEvent: validateEvent,
  EducationEvent: validateEvent,
  Festival: validateEvent,
  MusicEvent: validateEvent,
  SportsEvent: validateEvent,
  TheaterEvent: validateEvent,
  LocalBusiness: validateLocalBusiness,
  Restaurant: validateLocalBusiness,
  Store: validateLocalBusiness,
  Hotel: validateLocalBusiness,
  AutoDealer: validateLocalBusiness,
  ProfessionalService: validateLocalBusiness,
  MedicalBusiness: validateLocalBusiness,
  Organization: validateOrganization,
  Corporation: validateOrganization,
  NewsMediaOrganization: validateOrganization,
  EducationalOrganization: validateOrganization,
  GovernmentOrganization: validateOrganization,
  NGO: validateOrganization,
  PerformingGroup: validateOrganization,
  SportsOrganization: validateOrganization,
  WebSite: validateWebSite,
  WebPage: validateWebPage,
  CollectionPage: validateWebPage,
  ItemPage: validateWebPage,
  AboutPage: validateWebPage,
  ContactPage: validateWebPage,
  ProfilePage: validateWebPage,
  SearchResultsPage: validateWebPage,
  VideoObject: validateVideoObject,
  Movie: validateVideoObject,
  TVEpisode: validateVideoObject,
  BreadcrumbList: validateBreadcrumbList,
  Person: validatePerson,
  Review: validateReview,
  ClaimReview: validateReview,
  ImageObject: validateImageObject,
};

const RICH_RESULT_TYPES = new Set([
  'Article', 'NewsArticle', 'BlogPosting',
  'Product', 'FAQPage', 'HowTo', 'Recipe',
  'Event', 'LocalBusiness', 'VideoObject', 'BreadcrumbList', 'Review',
]);

function present(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
}

function check(severity, prop, message) {
  return { severity, prop, message };
}

function validateArticle(d) {
  const out = [];
  if (!present(d.headline)) out.push(check('fail', 'headline', 'Required: headline is missing.'));
  else if (typeof d.headline === 'string' && d.headline.length > 110) out.push(check('warn', 'headline', `headline is ${d.headline.length} chars — Google truncates around 110.`));
  else out.push(check('pass', 'headline', `headline ok.`));

  if (!present(d.image)) out.push(check('fail', 'image', 'Required: image is missing.'));
  else out.push(check('pass', 'image', 'image present.'));

  if (!present(d.datePublished)) out.push(check('fail', 'datePublished', 'Required: datePublished is missing.'));
  else if (!isLikelyDate(d.datePublished)) out.push(check('warn', 'datePublished', `datePublished doesn't look like ISO 8601: "${d.datePublished}".`));
  else out.push(check('pass', 'datePublished', 'datePublished present.'));

  if (!present(d.author)) out.push(check('warn', 'author', 'Recommended: author is missing.'));
  else out.push(check('pass', 'author', 'author present.'));

  if (!present(d.dateModified)) out.push(check('info', 'dateModified', 'Optional: dateModified not set.'));
  if (!present(d.publisher)) out.push(check('warn', 'publisher', 'Recommended: publisher (Organization with name+logo) is missing.'));
  return out;
}

function validateProduct(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', 'name present.'));

  const hasOffer = present(d.offers);
  const hasReview = present(d.review);
  const hasAgg = present(d.aggregateRating);
  if (!hasOffer && !hasReview && !hasAgg) {
    out.push(check('fail', 'offers', 'Required: at least one of offers, review, or aggregateRating is needed for Product rich results.'));
  } else {
    out.push(check('pass', 'offers/review/aggregateRating', 'Eligible (has offers, review, or aggregateRating).'));
  }

  if (hasOffer) {
    const offers = Array.isArray(d.offers) ? d.offers : [d.offers];
    for (const o of offers) {
      if (!present(o.price) && !present(o.lowPrice)) out.push(check('warn', 'offers.price', 'offers should include price or lowPrice.'));
      if (!present(o.priceCurrency)) out.push(check('warn', 'offers.priceCurrency', 'offers should include priceCurrency.'));
    }
  }

  if (!present(d.image)) out.push(check('warn', 'image', 'Recommended: image is missing.'));
  if (!present(d.brand)) out.push(check('info', 'brand', 'Optional: brand not set.'));
  return out;
}

function validateFAQPage(d) {
  const out = [];
  const main = d.mainEntity;
  if (!main) {
    out.push(check('fail', 'mainEntity', 'Required: mainEntity[] is missing.'));
    return out;
  }
  const entities = Array.isArray(main) ? main : [main];
  if (entities.length === 0) out.push(check('fail', 'mainEntity', 'Required: mainEntity must contain at least one Question.'));
  let badQuestions = 0;
  for (let i = 0; i < entities.length; i++) {
    const q = entities[i];
    const qPath = `mainEntity[${i}]`;
    const qTypes = normalizeTypes(q?.['@type']).map(stripContext);
    if (!qTypes.includes('Question')) out.push(check('warn', qPath + '.@type', `Expected @type "Question", got "${qTypes.join(',') || 'undefined'}".`));
    if (!present(q?.name)) { out.push(check('fail', qPath + '.name', 'Required: Question.name is missing.')); badQuestions++; }
    const ans = q?.acceptedAnswer;
    if (!ans) { out.push(check('fail', qPath + '.acceptedAnswer', 'Required: acceptedAnswer is missing.')); badQuestions++; }
    else {
      const aTypes = normalizeTypes(ans?.['@type']).map(stripContext);
      if (!aTypes.includes('Answer')) out.push(check('warn', qPath + '.acceptedAnswer.@type', `Expected @type "Answer", got "${aTypes.join(',') || 'undefined'}".`));
      if (!present(ans?.text)) { out.push(check('fail', qPath + '.acceptedAnswer.text', 'Required: Answer.text is missing.')); badQuestions++; }
    }
  }
  if (badQuestions === 0 && entities.length > 0) out.push(check('pass', 'mainEntity', `${entities.length} Question/Answer pairs look valid.`));
  return out;
}

function validateHowTo(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', 'name present.'));
  const steps = d.step;
  if (!steps) out.push(check('fail', 'step', 'Required: step[] is missing.'));
  else {
    const stepArr = Array.isArray(steps) ? steps : [steps];
    if (stepArr.length === 0) out.push(check('fail', 'step', 'Required: at least one step is needed.'));
    for (let i = 0; i < stepArr.length; i++) {
      const s = stepArr[i];
      if (!present(s?.name) && !present(s?.text)) out.push(check('warn', `step[${i}]`, 'Each step should have name or text.'));
    }
    if (stepArr.length > 0) out.push(check('pass', 'step', `${stepArr.length} steps declared.`));
  }
  if (!present(d.image)) out.push(check('warn', 'image', 'Recommended: image is missing.'));
  if (!present(d.totalTime) && !present(d.estimatedCost)) out.push(check('info', 'totalTime', 'Optional: totalTime/estimatedCost not set.'));
  return out;
}

function validateRecipe(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', 'name present.'));
  if (!present(d.image)) out.push(check('fail', 'image', 'Required: image is missing.'));
  else out.push(check('pass', 'image', 'image present.'));
  if (!present(d.recipeIngredient) && !present(d.ingredients)) out.push(check('fail', 'recipeIngredient', 'Required: recipeIngredient[] is missing.'));
  else out.push(check('pass', 'recipeIngredient', 'ingredients present.'));
  if (!present(d.recipeInstructions)) out.push(check('warn', 'recipeInstructions', 'Recommended: recipeInstructions is missing.'));
  if (!present(d.author)) out.push(check('warn', 'author', 'Recommended: author is missing.'));
  if (!present(d.datePublished)) out.push(check('info', 'datePublished', 'Optional: datePublished not set.'));
  return out;
}

function validateEvent(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', 'name present.'));
  if (!present(d.startDate)) out.push(check('fail', 'startDate', 'Required: startDate is missing.'));
  else if (!isLikelyDate(d.startDate)) out.push(check('warn', 'startDate', `startDate doesn't look like ISO 8601: "${d.startDate}".`));
  else out.push(check('pass', 'startDate', `startDate = ${d.startDate}.`));
  if (!present(d.location)) out.push(check('fail', 'location', 'Required: location is missing.'));
  else out.push(check('pass', 'location', 'location present.'));
  if (!present(d.endDate)) out.push(check('warn', 'endDate', 'Recommended: endDate is missing.'));
  if (!present(d.description)) out.push(check('warn', 'description', 'Recommended: description is missing.'));
  if (!present(d.image)) out.push(check('warn', 'image', 'Recommended: image is missing.'));
  if (!present(d.offers)) out.push(check('info', 'offers', 'Optional: offers (ticket info) not set.'));
  return out;
}

function validateLocalBusiness(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', 'name present.'));
  if (!present(d.address)) out.push(check('fail', 'address', 'Required: address (PostalAddress) is missing.'));
  else out.push(check('pass', 'address', 'address present.'));
  if (!present(d.telephone)) out.push(check('warn', 'telephone', 'Recommended: telephone is missing.'));
  if (!present(d.openingHours) && !present(d.openingHoursSpecification)) out.push(check('warn', 'openingHours', 'Recommended: openingHours is missing.'));
  if (!present(d.url)) out.push(check('warn', 'url', 'Recommended: url is missing.'));
  if (!present(d.image)) out.push(check('warn', 'image', 'Recommended: image is missing.'));
  if (!present(d.geo)) out.push(check('info', 'geo', 'Optional: geo coordinates not set.'));
  return out;
}

function validateOrganization(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', `name = "${d.name}".`));
  if (!present(d.url)) out.push(check('warn', 'url', 'Recommended: url is missing.'));
  else out.push(check('pass', 'url', 'url present.'));
  if (!present(d.logo)) out.push(check('warn', 'logo', 'Recommended: logo is missing.'));
  else out.push(check('pass', 'logo', 'logo present.'));
  if (!present(d.sameAs)) out.push(check('info', 'sameAs', 'Optional: sameAs (social profile URLs) not set.'));
  return out;
}

function validateWebSite(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  else out.push(check('pass', 'name', `name = "${d.name}".`));
  if (!present(d.url)) out.push(check('fail', 'url', 'Required: url is missing.'));
  else out.push(check('pass', 'url', 'url present.'));
  if (!present(d.potentialAction)) out.push(check('info', 'potentialAction', 'Optional: potentialAction (SearchAction) not set — needed for sitelinks search box.'));
  else out.push(check('pass', 'potentialAction', 'potentialAction present (sitelinks search box eligible).'));
  return out;
}

function validateWebPage(d) {
  const out = [];
  if (!present(d.name) && !present(d.headline)) out.push(check('warn', 'name', 'Recommended: name or headline is missing.'));
  else out.push(check('pass', 'name', 'name/headline present.'));
  if (!present(d.url)) out.push(check('warn', 'url', 'Recommended: url is missing.'));
  if (!present(d.description)) out.push(check('info', 'description', 'Optional: description not set.'));
  return out;
}

function validateVideoObject(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  if (!present(d.description)) out.push(check('fail', 'description', 'Required: description is missing.'));
  if (!present(d.thumbnailUrl) && !present(d.thumbnail)) out.push(check('fail', 'thumbnailUrl', 'Required: thumbnailUrl is missing.'));
  if (!present(d.uploadDate)) out.push(check('fail', 'uploadDate', 'Required: uploadDate is missing.'));
  if (!present(d.duration)) out.push(check('warn', 'duration', 'Recommended: duration (ISO 8601 like PT5M) is missing.'));
  if (!present(d.contentUrl) && !present(d.embedUrl)) out.push(check('warn', 'contentUrl', 'Recommended: contentUrl or embedUrl is missing.'));
  return out;
}

function validateBreadcrumbList(d) {
  const out = [];
  const items = d.itemListElement;
  if (!items) { out.push(check('fail', 'itemListElement', 'Required: itemListElement[] is missing.')); return out; }
  const arr = Array.isArray(items) ? items : [items];
  if (arr.length === 0) out.push(check('fail', 'itemListElement', 'Required: at least one ListItem is needed.'));
  let issues = 0;
  for (let i = 0; i < arr.length; i++) {
    const it = arr[i];
    if (!present(it?.position)) { out.push(check('fail', `itemListElement[${i}].position`, 'Required: position is missing.')); issues++; }
    if (!present(it?.name)) { out.push(check('warn', `itemListElement[${i}].name`, 'Recommended: name is missing.')); issues++; }
    if (!present(it?.item) && !present(it?.url)) out.push(check('info', `itemListElement[${i}].item`, 'Last breadcrumb may omit item.'));
  }
  if (issues === 0 && arr.length > 0) out.push(check('pass', 'itemListElement', `${arr.length} breadcrumb items look valid.`));
  return out;
}

function validatePerson(d) {
  const out = [];
  if (!present(d.name)) out.push(check('fail', 'name', 'Required: name is missing.'));
  if (!present(d.url)) out.push(check('info', 'url', 'Optional: url not set.'));
  return out;
}

function validateReview(d) {
  const out = [];
  if (!present(d.reviewRating)) out.push(check('fail', 'reviewRating', 'Required: reviewRating is missing.'));
  else {
    const r = d.reviewRating;
    if (!present(r?.ratingValue)) out.push(check('fail', 'reviewRating.ratingValue', 'Required: ratingValue is missing.'));
  }
  if (!present(d.author)) out.push(check('fail', 'author', 'Required: author is missing.'));
  if (!present(d.itemReviewed)) out.push(check('warn', 'itemReviewed', 'Recommended: itemReviewed is missing.'));
  return out;
}

function validateImageObject(d) {
  const out = [];
  if (!present(d.url) && !present(d.contentUrl)) out.push(check('warn', 'url', 'Recommended: url or contentUrl is missing.'));
  return out;
}

function isLikelyDate(v) {
  if (typeof v !== 'string') return false;
  // ISO 8601 — accepts "2024-01-15", "2024-01-15T10:00:00Z", etc.
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+\-]\d{2}:?\d{2})?)?$/.test(v);
}

function validateItem(item) {
  const checks = [];
  const effectiveCtx = item.data['@context'] || item.effectiveContext;
  if (!effectiveCtx) {
    checks.push(check('warn', '@context', 'Recommended: @context (e.g. "https://schema.org") is missing.'));
  } else {
    const ctxStr = Array.isArray(effectiveCtx) ? effectiveCtx.map((x) => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(', ') : (typeof effectiveCtx === 'object' ? JSON.stringify(effectiveCtx) : String(effectiveCtx));
    if (!/schema\.org/.test(ctxStr)) {
      checks.push(check('info', '@context', `@context is "${ctxStr.slice(0, 80)}${ctxStr.length > 80 ? '…' : ''}" — non-standard. Most validators expect schema.org.`));
    }
  }

  let validated = false;
  for (const t of item.types) {
    const stripped = stripContext(t);
    const v = VALIDATORS[stripped];
    if (v) {
      checks.push(...v(item.data));
      validated = true;
      break; // run validator for the most specific known type only
    }
  }
  if (!validated) {
    checks.push(check('info', '@type', `No specific validator for type "${item.types.map(stripContext).join(', ')}" — basic JSON-LD parse only.`));
  }
  return checks;
}

// ─── Microdata / RDFa detection (lightweight) ─────────────────────────────

function detectMicrodata($) {
  const items = [];
  $('[itemscope]').each((_, el) => {
    const itemtype = el.attribs.itemtype || null;
    let type = null;
    if (itemtype) {
      const last = itemtype.split(/\s+/)[0].split('/').filter(Boolean).pop();
      type = last || null;
    }
    items.push({ type, itemtype });
  });
  return items;
}

function detectRdfa($) {
  const items = [];
  $('[typeof]').each((_, el) => {
    items.push({ type: el.attribs.typeof || null, vocab: el.attribs.vocab || null });
  });
  return items;
}

// ─── Main ──────────────────────────────────────────────────────────────────

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

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
    const $ = cheerio.load(html);

    const blocks = extractJsonLd($);

    const items = [];
    let parseErrors = 0;
    blocks.forEach((block, blockIdx) => {
      if (block.parseError) {
        parseErrors++;
        items.push({
          format: 'JSON-LD',
          block: blockIdx,
          types: ['(parse error)'],
          parseError: block.parseError,
          raw: block.raw,
          checks: [{ severity: 'fail', prop: 'JSON', message: `Could not parse JSON-LD: ${block.parseError}` }],
          summary: { pass: 0, warn: 0, fail: 1, info: 0 },
        });
        return;
      }
      const collected = collectItems(block.parsed);
      if (collected.length === 0) {
        items.push({
          format: 'JSON-LD',
          block: blockIdx,
          types: ['(no @type)'],
          raw: block.raw,
          parsed: block.parsed,
          checks: [{ severity: 'warn', prop: '@type', message: 'JSON-LD block has no @type — most rich results require it.' }],
          summary: { pass: 0, warn: 1, fail: 0, info: 0 },
        });
        return;
      }
      for (const it of collected) {
        const checks = validateItem(it);
        items.push({
          format: 'JSON-LD',
          block: blockIdx,
          path: it.path,
          types: it.types.map(stripContext),
          rawTypes: it.types,
          data: it.data,
          checks,
          summary: {
            pass: checks.filter((c) => c.severity === 'pass').length,
            warn: checks.filter((c) => c.severity === 'warn').length,
            fail: checks.filter((c) => c.severity === 'fail').length,
            info: checks.filter((c) => c.severity === 'info').length,
          },
        });
      }
    });

    const microdata = detectMicrodata($);
    const rdfa = detectRdfa($);

    // Aggregate type counts
    const typeCounts = {};
    for (const it of items) {
      for (const t of it.types) {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }
    }

    const richResultEligible = items.filter((it) =>
      it.types.some((t) => RICH_RESULT_TYPES.has(t)) && (it.summary.fail === 0)
    );
    const richResultBlocked = items.filter((it) =>
      it.types.some((t) => RICH_RESULT_TYPES.has(t)) && (it.summary.fail > 0)
    );

    const overall = items.reduce((a, it) => ({
      pass: a.pass + it.summary.pass,
      warn: a.warn + it.summary.warn,
      fail: a.fail + it.summary.fail,
      info: a.info + it.summary.info,
    }), { pass: 0, warn: 0, fail: 0, info: 0 });

    const result = {
      url,
      finalUrl,
      httpStatus: res.status,
      contentType,
      redirectChain: chain,
      jsonLdBlocks: blocks.length,
      parseErrors,
      itemCount: items.length,
      typeCounts,
      items,
      microdata: { count: microdata.length, items: microdata },
      rdfa: { count: rdfa.length, items: rdfa },
      richResultEligibleCount: richResultEligible.length,
      richResultBlockedCount: richResultBlocked.length,
      richResultEligibleTypes: [...new Set(richResultEligible.flatMap((i) => i.types).filter((t) => RICH_RESULT_TYPES.has(t)))],
      richResultBlockedTypes: [...new Set(richResultBlocked.flatMap((i) => i.types).filter((t) => RICH_RESULT_TYPES.has(t)))],
      summary: overall,
    };
    void logToolHistory({ url: result.url, toolName: 'Schema Markup Checker', result });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    if (err?.name === 'AbortError') {
      return Response.json({ error: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` }, { status: 504 });
    }
    if (err?.cause?.code === 'ENOTFOUND' || err?.code === 'ENOTFOUND') {
      return Response.json({ error: 'Could not resolve that domain (DNS lookup failed).' }, { status: 502 });
    }
    if (err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED') {
      return Response.json({ error: 'Connection refused.' }, { status: 502 });
    }
    console.error('[schema-checker] unexpected error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
