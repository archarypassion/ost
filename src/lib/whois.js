import net from 'node:net';

const WHOIS_PORT = 43;
const CONNECT_TIMEOUT_MS = 8_000;
const READ_TIMEOUT_MS = 10_000;

// Known WHOIS servers for common TLDs (covers ~95% of queries fast).
const TLD_SERVERS = {
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.publicinterestregistry.org',
  info: 'whois.afilias.net',
  biz: 'whois.nic.biz',
  io: 'whois.nic.io',
  co: 'whois.nic.co',
  me: 'whois.nic.me',
  app: 'whois.nic.google',
  dev: 'whois.nic.google',
  ai: 'whois.nic.ai',
  xyz: 'whois.nic.xyz',
  tech: 'whois.nic.tech',
  online: 'whois.nic.online',
  store: 'whois.nic.store',
  blog: 'whois.nic.blog',
  cloud: 'whois.nic.cloud',
  shop: 'whois.nic.shop',
  uk: 'whois.nic.uk',
  de: 'whois.denic.de',
  fr: 'whois.nic.fr',
  nl: 'whois.domain-registry.nl',
  it: 'whois.nic.it',
  es: 'whois.nic.es',
  se: 'whois.iis.se',
  ru: 'whois.tcinet.ru',
  jp: 'whois.jprs.jp',
  cn: 'whois.cnnic.cn',
  in: 'whois.registry.in',
  br: 'whois.registro.br',
  au: 'whois.auda.org.au',
  ca: 'whois.cira.ca',
  us: 'whois.nic.us',
  ie: 'whois.weare.ie',
  ch: 'whois.nic.ch',
  pl: 'whois.dns.pl',
  nz: 'whois.srs.net.nz',
  za: 'whois.registry.net.za',
  mx: 'whois.mx',
};

function getServerForTld(domain) {
  const parts = domain.toLowerCase().split('.');
  const tld = parts[parts.length - 1];
  if (TLD_SERVERS[tld]) return TLD_SERVERS[tld];
  // ccTLD with two-label suffix (.co.uk, .com.au) — fall back to IANA
  return null;
}

function whoisQuery(server, query) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: server, port: WHOIS_PORT });
    socket.setTimeout(READ_TIMEOUT_MS);
    let data = '';
    let connected = false;
    const connectTimer = setTimeout(() => {
      if (!connected) { socket.destroy(); reject(new Error('WHOIS connect timeout')); }
    }, CONNECT_TIMEOUT_MS);
    socket.on('connect', () => {
      connected = true;
      clearTimeout(connectTimer);
      socket.write(query + '\r\n');
    });
    socket.on('data', (chunk) => { data += chunk.toString('utf8'); });
    socket.on('end', () => resolve(data));
    socket.on('timeout', () => { socket.destroy(); reject(new Error('WHOIS read timeout')); });
    socket.on('error', (err) => { clearTimeout(connectTimer); reject(err); });
  });
}

function findReferralServer(text) {
  // Common referral patterns
  const patterns = [
    /Registrar WHOIS Server:\s*([^\s]+)/i,
    /Whois Server:\s*([^\s]+)/i,
    /refer:\s*([^\s]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] && !/^https?:/i.test(m[1])) return m[1].trim();
  }
  return null;
}

const DATE_FIELDS = {
  creationDate: [
    /Creation Date:\s*(.+)/i,
    /created:\s*(.+)/i,
    /Created On:\s*(.+)/i,
    /Domain Registration Date:\s*(.+)/i,
    /Domain Create Date:\s*(.+)/i,
    /registered:\s*(.+)/i,
  ],
  expirationDate: [
    /Registry Expiry Date:\s*(.+)/i,
    /Registrar Registration Expiration Date:\s*(.+)/i,
    /Expiration Date:\s*(.+)/i,
    /Expiry Date:\s*(.+)/i,
    /paid-till:\s*(.+)/i,
    /Renewal Date:\s*(.+)/i,
    /expires:\s*(.+)/i,
  ],
  updatedDate: [
    /Updated Date:\s*(.+)/i,
    /Last Modified:\s*(.+)/i,
    /Last Updated On:\s*(.+)/i,
    /changed:\s*(.+)/i,
  ],
};

const FIELD_PATTERNS = {
  registrar: [/Registrar:\s*(.+)/i, /Sponsoring Registrar:\s*(.+)/i],
  registrarUrl: [/Registrar URL:\s*(.+)/i, /Registrar WHOIS Server:\s*(.+)/i],
  registrarIanaId: [/Registrar IANA ID:\s*(.+)/i],
  status: [/Domain Status:\s*(.+)/gi, /Status:\s*(.+)/gi],
  nameServers: [/Name Server:\s*(.+)/gi, /nserver:\s*(.+)/gi],
  registrantName: [/Registrant Name:\s*(.+)/i],
  registrantOrg: [/Registrant Organization:\s*(.+)/i, /Registrant\s+Organisation:\s*(.+)/i],
  registrantCountry: [/Registrant Country:\s*(.+)/i],
  abuseEmail: [/Registrar Abuse Contact Email:\s*(.+)/i],
};

function pickFirst(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim().replace(/\r$/, '');
  }
  return null;
}

function pickAll(text, patterns) {
  const out = new Set();
  for (const re of patterns) {
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : (re.flags + 'g'));
    let m;
    while ((m = r.exec(text)) !== null) {
      if (m[1]) out.add(m[1].trim().replace(/\r$/, ''));
    }
  }
  return [...out];
}

export async function lookupWhois(domain) {
  const lower = domain.toLowerCase();
  let server = getServerForTld(lower);
  let raw1 = null, raw2 = null, finalServer = server, ianaServer = null;

  // For unknown TLDs, ask IANA first.
  if (!server) {
    try {
      raw1 = await whoisQuery('whois.iana.org', lower);
      ianaServer = findReferralServer(raw1) || 'whois.iana.org';
      server = ianaServer;
      finalServer = ianaServer;
    } catch (err) {
      return { error: `IANA WHOIS lookup failed: ${err.message}` };
    }
  }

  try {
    raw2 = await whoisQuery(server, lower);
  } catch (err) {
    return { error: `WHOIS lookup at ${server} failed: ${err.message}`, raw1, server };
  }

  // Some thin TLDs (com/net) refer further to the registrar. Follow once.
  const referral = findReferralServer(raw2);
  let raw3 = null;
  if (referral && referral !== server) {
    try {
      raw3 = await whoisQuery(referral, lower);
      finalServer = referral;
    } catch { /* best effort */ }
  }

  const combined = [raw1, raw2, raw3].filter(Boolean).join('\n\n--- referral ---\n\n');

  const out = {
    domain: lower,
    server: finalServer,
    ianaServer,
    creationDate: pickFirst(combined, DATE_FIELDS.creationDate),
    expirationDate: pickFirst(combined, DATE_FIELDS.expirationDate),
    updatedDate: pickFirst(combined, DATE_FIELDS.updatedDate),
    registrar: pickFirst(combined, FIELD_PATTERNS.registrar),
    registrarUrl: pickFirst(combined, FIELD_PATTERNS.registrarUrl),
    registrarIanaId: pickFirst(combined, FIELD_PATTERNS.registrarIanaId),
    abuseEmail: pickFirst(combined, FIELD_PATTERNS.abuseEmail),
    registrant: {
      name: pickFirst(combined, FIELD_PATTERNS.registrantName),
      organisation: pickFirst(combined, FIELD_PATTERNS.registrantOrg),
      country: pickFirst(combined, FIELD_PATTERNS.registrantCountry),
    },
    statuses: pickAll(combined, FIELD_PATTERNS.status),
    nameServers: pickAll(combined, FIELD_PATTERNS.nameServers).map((n) => n.toLowerCase().split(/\s+/)[0]),
    raw: combined,
  };

  // Normalize dates
  for (const key of ['creationDate', 'expirationDate', 'updatedDate']) {
    if (out[key]) {
      const d = new Date(out[key]);
      if (!isNaN(d.getTime())) out[`${key}Iso`] = d.toISOString();
    }
  }

  if (out.creationDateIso) {
    const ageMs = Date.now() - Date.parse(out.creationDateIso);
    out.ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    out.ageYears = +(ageMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2);
  }

  if (out.expirationDateIso) {
    const exp = Date.parse(out.expirationDateIso);
    out.daysUntilExpiry = Math.floor((exp - Date.now()) / (1000 * 60 * 60 * 24));
  }

  // De-duplicate nameservers
  out.nameServers = [...new Set(out.nameServers)];

  return out;
}
