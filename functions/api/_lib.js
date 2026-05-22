/* Shared helpers for Cloudflare Functions */

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
