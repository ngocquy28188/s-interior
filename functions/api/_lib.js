/* Shared helpers for Cloudflare Functions */

/* ── Gateway: lấy API key từ PocketBase nếu không có trong form/env ── */
const PB_URL = 'https://db.mkg.vn';
const PB_EMAIL = 'quy28181818@gmail.com';
const PB_PASS  = '@Mkg201444';

let _pbToken     = null;
let _pbTokenExp  = 0;
let _gwConfig    = null;
let _gwConfigTime = 0;

async function pbAuth() {
  if (_pbToken && _pbTokenExp > Date.now()) return _pbToken;
  const r = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS }),
  });
  const d = await r.json();
  if (!d.token) throw new Error('PocketBase auth failed');
  _pbToken    = d.token;
  _pbTokenExp = Date.now() + 10 * 24 * 60 * 60 * 1000; // 10 ngày
  return _pbToken;
}

async function loadGatewayConfig() {
  if (_gwConfig && Date.now() - _gwConfigTime < 30000) return _gwConfig; // cache 30s
  const token = await pbAuth();
  const r = await fetch(`${PB_URL}/api/collections/banana_sync/records?filter=key%3D%22gateway_config%22`, {
    headers: { 'Authorization': token },
  });
  const d = await r.json();
  _gwConfig    = d.items?.[0]?.data || {};
  _gwConfigTime = Date.now();
  return _gwConfig;
}

/**
 * Ưu tiên: formKey > envKey > PocketBase gateway_config.openrouterKey
 */
export async function getGatewayKey(formKey, envKey) {
  if (formKey && formKey.trim()) return formKey.trim();
  if (envKey  && envKey.trim())  return envKey.trim();
  try {
    const cfg = await loadGatewayConfig();
    return cfg.openrouterKey || '';
  } catch (e) {
    console.warn('[GATEWAY] Could not load key from DB:', e.message);
    return '';
  }
}

/**
 * Trả về toàn bộ gateway config từ PocketBase
 * { openrouterKey, projectId, authorization, apiKey, maxStudioKey }
 * Merge với override (từ form/client) — client luôn ưu tiên
 */
export async function getFullGatewayConfig(override = {}) {
  let cfg = {};
  try {
    cfg = await loadGatewayConfig();
  } catch (e) {
    console.warn('[GATEWAY] Could not load full config from DB:', e.message);
  }
  return {
    openrouterKey:  (override.openrouterKey  || cfg.openrouterKey  || '').trim(),
    projectId:      (override.projectId      || cfg.projectId      || '').trim(),
    authorization:  (override.authorization  || cfg.authorization  || '').trim(),
    apiKey:         (override.apiKey         || cfg.apiKey         || cfg.maxStudioKey || '').trim(),
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function err(msg, status = 500) {
  return json({ error: msg }, status);
}

export function cleanPrompt(str) {
  if (!str) return '';
  return str
    .normalize('NFC')
    // Smart quotes → ASCII
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // En/Em dash → hyphen
    .replace(/[\u2013\u2014]/g, '-')
    // Remove control chars
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Strip non-ASCII (Vietnamese, emoji, etc.) to avoid ByteString errors
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fileToBase64(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}
