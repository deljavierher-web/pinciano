import { renderLoginHtml, renderPanelHtml } from './panel_ui.js';

const SNAPSHOT_KEY = 'snapshot_v1';
const VISITS_KEY = 'visits_v1';
const COOKIE_NAME = 'cpm_session';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_S = 900; // 15 min
const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|curl|wget|python-requests|httpx|lighthouse|pingdom|uptime|headless/i;
const STATIC_EXT_RE = /\.(css|js|mjs|png|jpe?g|webp|gif|svg|ico|mp4|webm|woff2?|ttf|map|json|xml|txt)$/i;
const ALLOWED_CLICK_EVENTS = new Set([
  'click_free_community',
  'click_free_channel',
  'click_vip_bot',
  'calc_use',
]);

// Rutas de atribución pinciano.es/a/<código> -> 302 al deep link del bot.
// Códigos y bot confirmados por Surebet-Telegram (solo [A-Za-z0-9_-], <=64).
const REF_BOT_USERNAME = 'surebets_pinciano_bot';
const REF_CODES = ['yt_f1', 'yt_f2', 'yt_f3', 'yt_f4', 'yt_f5', 'yt_entrada'];
// Códigos de Instagram/anuncios: NO saltan directos a Telegram. /a/<código> lleva a la landing
// limpia /empieza?c=<código> y el botón de la landing pasa por /ir/<código> hacia el bot.
const LANDING_CODES = [
  'ig_bio',
  'ig_f1', 'ig_f2', 'ig_f3', 'ig_f4', 'ig_f5',
  'ad_ig_1', 'ad_ig_2', 'ad_ig_3', 'ad_ig_4', 'ad_ig_5',
  // Reel «Cómo entrar» (X y Telegram) y tráfico orgánico sin código en /empieza
  'x_entrada', 'tg_entrada', 'web_empieza',
];
const LANDING_PATH = '/empieza';
const GO_PATH_RE = /^\/ir\/([A-Za-z0-9_-]{1,64})\/?$/;
const GO_KEY_PREFIX = 'go_';
const REF_KEY_PREFIX = 'ref_v1:';
const REF_PATH_RE = /^\/a\/([A-Za-z0-9_-]{1,64})\/?$/;

// Pestaña VIP del CRM: el panel encola acciones, el bot del Mac las aplica y devuelve el listado.
const VIP_ROSTER_KEY = 'vip_roster_v1';
const VIP_QUEUE_KEY = 'vip_queue_v1';
const VIP_LOG_KEY = 'vip_log_v1';
const VIP_LOG_MAX = 40;
const VIP_QUEUE_MAX = 50;
const VIP_ACTIONS = new Set(['kick', 'extend']);

const memoryRateLimit = new Map();
const encoder = new TextEncoder();

function privateHeaders(contentType, extra = {}) {
  return {
    'Content-Type': contentType,
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    ...extra,
  };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: privateHeaders('application/json; charset=utf-8', extraHeaders),
  });
}

function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: privateHeaders('text/html; charset=utf-8', extraHeaders),
  });
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function timingSafeEqualStr(a, b) {
  return timingSafeEqualBytes(encoder.encode(String(a || '')), encoder.encode(String(b || '')));
}

function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64url) {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const raw = String(storedHash).trim();

  if (raw.startsWith('pbkdf2_sha256$')) {
    const parts = raw.split('$');
    if (parts.length !== 4) return false;
    const iters = parseInt(parts[1], 10);
    const salt = hexToBytes(parts[2]);
    const expected = hexToBytes(parts[3]);
    if (!Number.isFinite(iters) || iters < 1000 || !salt || !expected) return false;

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derived = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iters },
        keyMaterial,
        expected.length * 8
      )
    );
    return timingSafeEqualBytes(derived, expected);
  }

  if (raw.startsWith('sha256$')) {
    const expected = hexToBytes(raw.slice('sha256$'.length));
    if (!expected) return false;
    const digest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', encoder.encode(password))
    );
    return timingSafeEqualBytes(digest, expected);
  }

  return false;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function createSessionToken(secret, ttlSeconds) {
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64)));
  return `${payloadB64}.${bytesToBase64Url(sig)}`;
}

async function verifySessionToken(token, secret) {
  if (!token || !secret || !token.includes('.')) return false;
  const [payloadB64, sigB64] = token.split('.', 2);
  if (!payloadB64 || !sigB64) return false;
  let sigBytes;
  try {
    sigBytes = base64UrlToBytes(sigB64);
  } catch {
    return false;
  }
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payloadB64));
  if (!ok) return false;
  try {
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson);
    return Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return '';
}

function getClientIp(request) {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp.trim();
  const xff = request.headers.get('X-Forwarded-For');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

async function checkRateLimit(env, ip) {
  const nowS = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${ip}`;
  if (env.PINCIANO_CPM) {
    const raw = await env.PINCIANO_CPM.get(key, { type: 'json' }).catch(() => null);
    if (raw && raw.resetAt > nowS && raw.count >= RATE_LIMIT_MAX) {
      return false;
    }
    return true;
  }
  const entry = memoryRateLimit.get(key);
  if (entry && entry.resetAt > nowS && entry.count >= RATE_LIMIT_MAX) return false;
  return true;
}

async function recordFailedLogin(env, ip) {
  const nowS = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${ip}`;
  if (env.PINCIANO_CPM) {
    const cur = (await env.PINCIANO_CPM.get(key, { type: 'json' }).catch(() => null)) || {
      count: 0,
      resetAt: nowS + RATE_LIMIT_WINDOW_S,
    };
    const next =
      cur.resetAt <= nowS
        ? { count: 1, resetAt: nowS + RATE_LIMIT_WINDOW_S }
        : { count: cur.count + 1, resetAt: cur.resetAt };
    await env.PINCIANO_CPM.put(key, JSON.stringify(next), {
      expirationTtl: RATE_LIMIT_WINDOW_S,
    }).catch(() => {});
    return;
  }
  const cur = memoryRateLimit.get(key);
  if (!cur || cur.resetAt <= nowS) {
    memoryRateLimit.set(key, { count: 1, resetAt: nowS + RATE_LIMIT_WINDOW_S });
  } else {
    cur.count += 1;
  }
}

async function clearFailedLogins(env, ip) {
  const key = `ratelimit:${ip}`;
  if (env.PINCIANO_CPM) {
    await env.PINCIANO_CPM.delete(key).catch(() => {});
  }
  memoryRateLimit.delete(key);
}

function isBearerAuthorized(request, env) {
  if (!env.CPM_SYNC_TOKEN) return false;
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  return timingSafeEqualStr(auth.slice(7).trim(), env.CPM_SYNC_TOKEN);
}

function madridDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function emptyVisits() {
  return {
    total: 0,
    by_path: { '/': 0, '/calculadora': 0 },
    by_day: {},
    utm_sources: {},
    clicks: {
      click_free_community: 0,
      click_free_channel: 0,
      click_vip_bot: 0,
      calc_use: 0,
    },
    updated_at: null,
  };
}

function summarizeVisits(rawVisits) {
  const v = {
    ...emptyVisits(),
    ...(rawVisits || {}),
    by_path: { '/': 0, '/calculadora': 0, ...((rawVisits && rawVisits.by_path) || {}) },
    by_day: { ...((rawVisits && rawVisits.by_day) || {}) },
    utm_sources: { ...((rawVisits && rawVisits.utm_sources) || {}) },
    clicks: {
      click_free_community: 0,
      click_free_channel: 0,
      click_vip_bot: 0,
      calc_use: 0,
      ...((rawVisits && rawVisits.clicks) || {}),
    },
  };

  const today = madridDay();
  const days7 = new Set();
  for (let i = 0; i < 7; i += 1) {
    days7.add(madridDay(new Date(Date.now() - i * 86400 * 1000)));
  }
  let last7d = 0;
  for (const [day, count] of Object.entries(v.by_day)) {
    if (days7.has(day)) last7d += Number(count || 0);
  }
  return {
    ...v,
    today: Number(v.by_day[today] || 0),
    last_7d: last7d,
  };
}

async function trackVisit(env, url, userAgent) {
  if (!env.PINCIANO_CPM) return;
  if (BOT_UA_RE.test(userAgent || '')) return;

  let normPath = url.pathname;
  if (normPath === '/index.html') normPath = '/';
  if (normPath === '/calculadora.html') normPath = '/calculadora';
  if (normPath !== '/' && normPath !== '/calculadora') return;

  const visits = (await env.PINCIANO_CPM.get(VISITS_KEY, { type: 'json' }).catch(() => null)) || emptyVisits();
  visits.total = Number(visits.total || 0) + 1;
  visits.by_path = visits.by_path || {};
  visits.by_path[normPath] = Number(visits.by_path[normPath] || 0) + 1;

  const day = madridDay();
  visits.by_day = visits.by_day || {};
  visits.by_day[day] = Number(visits.by_day[day] || 0) + 1;

  const utm = (url.searchParams.get('utm_source') || '').trim().slice(0, 64);
  if (utm) {
    visits.utm_sources = visits.utm_sources || {};
    visits.utm_sources[utm] = Number(visits.utm_sources[utm] || 0) + 1;
  }

  visits.updated_at = new Date().toISOString();
  await env.PINCIANO_CPM.put(VISITS_KEY, JSON.stringify(visits));
}

async function landingIsPublished(env, url) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') return false;
  try {
    const res = await env.ASSETS.fetch(
      new Request(new URL(LANDING_PATH, url.origin).toString(), { method: 'GET', redirect: 'manual' }),
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

function refDestination(code) {
  return `https://t.me/${REF_BOT_USERNAME}?start=${code}`;
}

// Contador por ruta y día (Europe/Madrid): clave ref_v1:<código>:<YYYY-MM-DD> = entero.
// Una clave por ruta/día reduce la contención frente a un único JSON global.
async function trackRefClick(env, code) {
  if (!env.PINCIANO_CPM) return;
  const key = `${REF_KEY_PREFIX}${code}:${madridDay()}`;
  const cur = Number(await env.PINCIANO_CPM.get(key).catch(() => 0)) || 0;
  await env.PINCIANO_CPM.put(key, String(cur + 1));
}

async function readRefClicks(env) {
  const tracked = [...REF_CODES, ...LANDING_CODES, ...LANDING_CODES.map((c) => GO_KEY_PREFIX + c)];
  const out = { codes: tracked, total: {}, by_day: {}, today: {}, updated_at: null };
  for (const c of tracked) out.total[c] = 0;
  if (!env.PINCIANO_CPM || typeof env.PINCIANO_CPM.list !== 'function') return out;
  const today = madridDay();
  let cursor;
  do {
    const page = await env.PINCIANO_CPM.list({ prefix: REF_KEY_PREFIX, cursor }).catch(() => null);
    if (!page) break;
    for (const k of page.keys || []) {
      const [code, day] = k.name.slice(REF_KEY_PREFIX.length).split(':');
      if (!code || !day) continue;
      const n = Number(await env.PINCIANO_CPM.get(k.name).catch(() => 0)) || 0;
      out.total[code] = (out.total[code] || 0) + n;
      out.by_day[day] = out.by_day[day] || {};
      out.by_day[day][code] = n;
      if (day === today) out.today[code] = n;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  out.updated_at = new Date().toISOString();
  return out;
}

async function trackClick(env, eventName) {
  if (!env.PINCIANO_CPM || !ALLOWED_CLICK_EVENTS.has(eventName)) return;
  const visits = (await env.PINCIANO_CPM.get(VISITS_KEY, { type: 'json' }).catch(() => null)) || emptyVisits();
  visits.clicks = visits.clicks || {};
  visits.clicks[eventName] = Number(visits.clicks[eventName] || 0) + 1;
  visits.updated_at = new Date().toISOString();
  await env.PINCIANO_CPM.put(VISITS_KEY, JSON.stringify(visits));
}

async function kvJson(env, key, fallback) {
  if (!env.PINCIANO_CPM) return fallback;
  const v = await env.PINCIANO_CPM.get(key, { type: 'json' }).catch(() => null);
  return v == null ? fallback : v;
}

function sameOriginWrite(request, url) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return false;
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  return ct.includes('application/json');
}

function newActionId() {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return `a_${Date.now().toString(36)}_${bytesToBase64Url(b)}`;
}

async function enqueueVipAction(env, body) {
  const action = String(body.action || '');
  const tid = Number(body.telegram_id);
  if (!VIP_ACTIONS.has(action) || !Number.isSafeInteger(tid) || tid <= 0) {
    return { status: 400, data: { ok: false, error: 'invalid_action' } };
  }
  const roster = await kvJson(env, VIP_ROSTER_KEY, { members: [] });
  const member = (roster.members || []).find((m) => Number(m.telegram_id) === tid);
  if (!member) {
    return { status: 404, data: { ok: false, error: 'not_in_vip' } };
  }
  const queue = await kvJson(env, VIP_QUEUE_KEY, []);
  if (queue.some((q) => Number(q.telegram_id) === tid)) {
    return { status: 409, data: { ok: false, error: 'already_pending' } };
  }
  if (queue.length >= VIP_QUEUE_MAX) {
    return { status: 429, data: { ok: false, error: 'queue_full' } };
  }
  let days = Math.round(Number(body.days || 30));
  if (!Number.isFinite(days)) days = 30;
  days = Math.max(1, Math.min(62, days));
  const item = {
    id: newActionId(),
    action,
    telegram_id: tid,
    name: String(member.first_name || member.username || tid).slice(0, 64),
    days: action === 'extend' ? days : undefined,
    paid: action === 'extend' ? body.paid !== false : undefined,
    notify: body.notify !== false,
    requested_at: new Date().toISOString(),
  };
  queue.push(item);
  await env.PINCIANO_CPM.put(VIP_QUEUE_KEY, JSON.stringify(queue));
  return { status: 200, data: { ok: true, queued: item } };
}

async function applyVipSync(env, payload) {
  const members = Array.isArray(payload.members) ? payload.members.slice(0, 2000) : [];
  const results = Array.isArray(payload.results) ? payload.results.slice(0, VIP_QUEUE_MAX) : [];
  const syncedAt = new Date().toISOString();
  await env.PINCIANO_CPM.put(
    VIP_ROSTER_KEY,
    JSON.stringify({ members, generated_at: payload.generated_at || syncedAt, synced_at: syncedAt }),
  );
  if (results.length) {
    const doneIds = new Set(results.map((r) => String(r.id || '')));
    const queue = await kvJson(env, VIP_QUEUE_KEY, []);
    const done = queue.filter((q) => doneIds.has(q.id));
    await env.PINCIANO_CPM.put(VIP_QUEUE_KEY, JSON.stringify(queue.filter((q) => !doneIds.has(q.id))));
    const log = await kvJson(env, VIP_LOG_KEY, []);
    for (const r of results) {
      const q = done.find((x) => x.id === String(r.id || '')) || {};
      log.unshift({
        id: String(r.id || ''),
        action: String(r.action || q.action || ''),
        telegram_id: Number(r.telegram_id || q.telegram_id || 0),
        name: q.name || '',
        days: q.days,
        ok: Boolean(r.ok),
        message: String(r.message || '').slice(0, 300),
        requested_at: q.requested_at || null,
        applied_at: syncedAt,
      });
    }
    await env.PINCIANO_CPM.put(VIP_LOG_KEY, JSON.stringify(log.slice(0, VIP_LOG_MAX)));
  }
  return { ok: true, members: members.length, results: results.length, synced_at: syncedAt };
}

async function parseLoginBody(request) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return {
      password: String(body.password || ''),
      remember: Boolean(body.remember),
      isJson: true,
    };
  }
  const form = await request.formData().catch(() => null);
  if (form) {
    return {
      password: String(form.get('password') || ''),
      remember: form.get('remember') === '1' || form.get('remember') === 'true' || form.get('remember') === 'on',
      isJson: false,
    };
  }
  return { password: '', remember: false, isJson: false };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // 1) Beacon público de clics
    if (path === '/cpm/t' && method === 'POST') {
      const rawText = await request.text().catch(() => '');
      let evt = '';
      try {
        evt = String(JSON.parse(rawText).event || '');
      } catch {
        evt = rawText.trim();
      }
      if (ALLOWED_CLICK_EVENTS.has(evt) && ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(trackClick(env, evt));
      } else if (ALLOWED_CLICK_EVENTS.has(evt)) {
        await trackClick(env, evt);
      }
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }

    // 2) Rutas privadas /cpm y /cpm/*
    if (path === '/cpm' || path.startsWith('/cpm/')) {
      if (path === '/cpm/login' && method === 'POST') {
        const ip = getClientIp(request);
        const allowed = await checkRateLimit(env, ip);
        const { password, remember, isJson } = await parseLoginBody(request);
        if (!allowed) {
          return isJson
            ? jsonResponse({ ok: false, error: 'rate_limited' }, 429)
            : htmlResponse(renderLoginHtml({ errorMessage: 'Demasiados intentos. Espera 15 minutos.' }), 429);
        }
        if (!env.CPM_PASSWORD_HASH || !env.CPM_SESSION_SECRET) {
          return jsonResponse({ ok: false, error: 'cpm_not_configured' }, 503);
        }
        const ok = await verifyPassword(password, env.CPM_PASSWORD_HASH);
        if (!ok) {
          await recordFailedLogin(env, ip);
          return isJson
            ? jsonResponse({ ok: false, error: 'invalid_credentials' }, 401)
            : htmlResponse(renderLoginHtml({ errorMessage: 'Contraseña incorrecta.' }), 401);
        }

        await clearFailedLogins(env, ip);
        const ttl = remember ? 30 * 86400 : 12 * 3600;
        const token = await createSessionToken(env.CPM_SESSION_SECRET, ttl);
        const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/cpm; Max-Age=${ttl}`;
        if (isJson) {
          return jsonResponse({ ok: true }, 200, { 'Set-Cookie': cookie });
        }
        return new Response(null, {
          status: 303,
          headers: privateHeaders('text/plain', {
            Location: '/cpm',
            'Set-Cookie': cookie,
          }),
        });
      }

      if (path === '/cpm/logout' && method === 'POST') {
        const clearCookie = `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/cpm; Max-Age=0`;
        return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearCookie });
      }

      if (path === '/cpm/api/sync' && method === 'POST') {
        if (!isBearerAuthorized(request, env)) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        if (!env.PINCIANO_CPM) {
          return jsonResponse({ ok: false, error: 'kv_not_bound' }, 503);
        }
        const payload = await request.json().catch(() => null);
        if (!payload || typeof payload !== 'object') {
          return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
        }
        await env.PINCIANO_CPM.put(SNAPSHOT_KEY, JSON.stringify(payload));
        return jsonResponse({ ok: true, saved_at: new Date().toISOString() }, 200);
      }

      if (path === '/cpm/api/visits' && method === 'GET') {
        if (!isBearerAuthorized(request, env)) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        const rawVisits = env.PINCIANO_CPM
          ? await env.PINCIANO_CPM.get(VISITS_KEY, { type: 'json' }).catch(() => null)
          : null;
        return jsonResponse({ ...summarizeVisits(rawVisits), ref_clicks: await readRefClicks(env) }, 200);
      }

      if (path === '/cpm/api/vip/queue' && method === 'GET') {
        if (!isBearerAuthorized(request, env)) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        return jsonResponse({ ok: true, actions: await kvJson(env, VIP_QUEUE_KEY, []) }, 200);
      }

      if (path === '/cpm/api/vip/sync' && method === 'POST') {
        if (!isBearerAuthorized(request, env)) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        if (!env.PINCIANO_CPM) {
          return jsonResponse({ ok: false, error: 'kv_not_bound' }, 503);
        }
        const payload = await request.json().catch(() => null);
        if (!payload || typeof payload !== 'object') {
          return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
        }
        return jsonResponse(await applyVipSync(env, payload), 200);
      }

      // Sesiones de usuario para /cpm y /cpm/api/data
      const sessionCookie = getCookie(request, COOKIE_NAME);
      const authed = await verifySessionToken(sessionCookie, env.CPM_SESSION_SECRET);

      if (path === '/cpm/api/data' && method === 'GET') {
        if (!authed) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        const [snapshot, rawVisits] = env.PINCIANO_CPM
          ? await Promise.all([
              env.PINCIANO_CPM.get(SNAPSHOT_KEY, { type: 'json' }).catch(() => null),
              env.PINCIANO_CPM.get(VISITS_KEY, { type: 'json' }).catch(() => null),
            ])
          : [null, null];
        const visits = summarizeVisits(rawVisits);
        const base = snapshot && typeof snapshot === 'object' ? snapshot : {
          generated_at: null,
          calendar: [],
          ranking: { winners: [], losers: [], by_channel: [], by_format: [], insights: [] },
          telegram: { total_members: 0, founders_taken: 0, by_source: {} },
          alerts: ['Esperando la primera sincronización desde sync_cpm.py.'],
        };
        return jsonResponse({ ...base, visits }, 200);
      }

      if (path === '/cpm/api/vip' && method === 'GET') {
        if (!authed) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        const [roster, queue, log] = await Promise.all([
          kvJson(env, VIP_ROSTER_KEY, { members: [], generated_at: null, synced_at: null }),
          kvJson(env, VIP_QUEUE_KEY, []),
          kvJson(env, VIP_LOG_KEY, []),
        ]);
        return jsonResponse({ ok: true, ...roster, queue, log, server_time: new Date().toISOString() }, 200);
      }

      if (path === '/cpm/api/vip/action' && method === 'POST') {
        if (!authed) {
          return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
        }
        if (!sameOriginWrite(request, url)) {
          return jsonResponse({ ok: false, error: 'forbidden' }, 403);
        }
        if (!env.PINCIANO_CPM) {
          return jsonResponse({ ok: false, error: 'kv_not_bound' }, 503);
        }
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
          return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
        }
        const out = await enqueueVipAction(env, body);
        return jsonResponse(out.data, out.status);
      }

      if ((path === '/cpm' || path === '/cpm/') && method === 'GET') {
        if (!authed) {
          return htmlResponse(renderLoginHtml(), 200);
        }
        return htmlResponse(renderPanelHtml(), 200);
      }

      return jsonResponse({ ok: false, error: 'not_found' }, 404);
    }

    // 2b) Rutas de atribución /a/<código>: contador por ruta y día + 302
    //     yt_fN            -> deep link directo del bot
    //     ig_* / ad_ig_*   -> landing limpia /empieza?c=<código> (solo si la landing está publicada)
    //     /ir/<código>     -> deep link del bot (botón de la landing), contado como go_<código>
    const isRead = method === 'GET' || method === 'HEAD';
    const refMatch = isRead ? REF_PATH_RE.exec(path) : null;
    const goMatch = isRead ? GO_PATH_RE.exec(path) : null;
    const refCode = refMatch ? refMatch[1].toLowerCase() : null;
    const goCode = goMatch ? goMatch[1].toLowerCase() : null;
    const isDirectCode = refCode !== null && REF_CODES.includes(refCode);
    const isLandingCode = refCode !== null && LANDING_CODES.includes(refCode);
    const isGoCode = goCode !== null && LANDING_CODES.includes(goCode);

    if (isDirectCode || isLandingCode || isGoCode) {
      let location = null;
      let countKey = null;
      if (isDirectCode) {
        location = refDestination(refCode);
        countKey = refCode;
      } else if (isGoCode) {
        location = refDestination(goCode);
        countKey = GO_KEY_PREFIX + goCode;
      } else if (await landingIsPublished(env, url)) {
        location = `${url.origin}${LANDING_PATH}?c=${refCode}`;
        countKey = refCode;
      }
      if (location !== null) {
        const ua = request.headers.get('User-Agent') || '';
        // Solo se cuentan GET de navegadores reales; HEAD y bots redirigen sin contar.
        if (method === 'GET' && ua && !BOT_UA_RE.test(ua)) {
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(trackRefClick(env, countKey));
          } else {
            await trackRefClick(env, countKey);
          }
        }
        return new Response(null, {
          status: 302,
          headers: {
            Location: location,
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow',
            'Referrer-Policy': 'no-referrer',
          },
        });
      }
      // Landing aún sin publicar: el código no redirige (cae al 404 de ASSETS).
    }

    // 3) Tráfico público: tracking ligero en / y /calculadora + passthrough a ASSETS
    if (
      method === 'GET' &&
      !STATIC_EXT_RE.test(path) &&
      (path === '/' || path === '/index.html' || path === '/calculadora' || path === '/calculadora.html')
    ) {
      const ua = request.headers.get('User-Agent') || '';
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(trackVisit(env, url, ua));
      } else {
        await trackVisit(env, url, ua);
      }
    }

    if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
      return new Response('Assets binding unavailable', { status: 500 });
    }
    return env.ASSETS.fetch(request);
  },
};
