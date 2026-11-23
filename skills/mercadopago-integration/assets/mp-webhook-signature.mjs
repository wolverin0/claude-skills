// mp-webhook-signature.mjs — MercadoPago webhook helpers. Plain ESM with Web
// Crypto only, so the same file runs in a Supabase Edge Function (Deno) and in
// Node 18+ tests. Copy it next to the function's index.ts.
//
// x-signature header: "ts=<timestamp>,v1=<hex hmac>". The signed manifest is
//   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// where data.id comes from the notification URL query (?data.id=...) and is
// used exactly as received (trimmed; case preserved, as in the official
// mercadopago SDK validator). A part whose value is missing is left out.
// v1 = hex(HMAC-SHA256(secret, manifest)), secret = the webhook "secret
// signature" from the MercadoPago application settings.

/** @returns {{ts: string|null, v1: string|null}} */
export function parseXSignature(header) {
  const out = { ts: null, v1: null };
  for (const part of String(header || '').split(',')) {
    const [k, ...rest] = part.split('=');
    const key = (k || '').trim();
    const value = rest.join('=').trim();
    if (key === 'ts') out.ts = value || null;
    if (key === 'v1') out.v1 = value || null;
  }
  return out;
}

/** Build the signed manifest; parts with a missing value are omitted. */
export function buildManifest({ dataId, requestId, ts }) {
  const clean = (v) => (v == null ? '' : String(v).trim());
  const id = clean(dataId);
  const rid = clean(requestId);
  const t = clean(ts);
  let manifest = '';
  if (id) manifest += `id:${id};`;
  if (rid) manifest += `request-id:${rid};`;
  if (t) manifest += `ts:${t};`;
  return manifest;
}

export async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify a webhook notification.
 * @param {{xSignature: string|null, xRequestId: string|null, dataId: string|null,
 *          secret: string, toleranceSec?: number, nowMs?: number}} opts
 * @returns {Promise<{valid: boolean, reason: string}>}
 */
export async function verifyMpSignature({ xSignature, xRequestId, dataId, secret, toleranceSec = 0, nowMs = Date.now() }) {
  if (!secret) return { valid: false, reason: 'missing secret' };
  const { ts, v1 } = parseXSignature(xSignature);
  if (!ts || !v1) return { valid: false, reason: 'missing ts or v1 in x-signature' };
  if (toleranceSec > 0) {
    const n = Number(ts);
    const tsMs = n > 1e12 ? n : n * 1000;          // the SDK treats ts as seconds; accept milliseconds too
    if (!Number.isFinite(n) || Math.abs(nowMs - tsMs) > toleranceSec * 1000) {
      return { valid: false, reason: 'timestamp outside tolerance' };
    }
  }
  const expected = await hmacSha256Hex(secret, buildManifest({ dataId, requestId: xRequestId, ts }));
  return timingSafeEqualHex(expected, v1.toLowerCase())
    ? { valid: true, reason: 'ok' }
    : { valid: false, reason: 'signature mismatch' };
}

/**
 * Classify a notification. Webhooks (signed) carry type/action and data.id;
 * legacy IPN (unsigned) carries ?topic=payment&id=<id>.
 * @returns {{kind: 'webhook'|'ipn'|'unknown', topic: string|null, id: string|null}}
 */
export function parseNotification(url, body) {
  const q = url.searchParams;
  const b = body && typeof body === 'object' ? body : {};
  const type = b.type || q.get('type') || (typeof b.action === 'string' ? b.action.split('.')[0] : null);
  const webhookId = (b.data && b.data.id) || q.get('data.id');
  if (type && webhookId) return { kind: 'webhook', topic: String(type), id: String(webhookId) };
  const topic = q.get('topic') || b.topic || null;
  const ipnId = q.get('id') || b.resource?.toString().split('/').pop() || null;
  if (topic && ipnId) return { kind: 'ipn', topic: String(topic), id: String(ipnId) };
  return { kind: 'unknown', topic: null, id: null };
}

/** Idempotency key: one processing per payment and status, across webhook + IPN + retries. */
export function eventKey(payment) {
  return `payment:${payment.id}:${payment.status}`;
}
