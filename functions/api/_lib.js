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
  if (url === 'https://openrouter.ai/api/v1/chat/completions') {
    const authHeader = options.headers?.['Authorization'] || options.headers?.['authorization'] || '';
    if (authHeader.includes('sk-proj-') || authHeader.startsWith('sk-proj-')) {
      url = 'https://api.openai.com/v1/chat/completions';
      if (options.headers) {
        delete options.headers['HTTP-Referer'];
        delete options.headers['http-referer'];
        delete options.headers['X-Title'];
        delete options.headers['x-title'];
      }
      if (options.body) {
        try {
          const bodyObj = JSON.parse(options.body);
          bodyObj.model = 'gpt-5.4-mini';
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          console.error('[apiFetch rewrite] failed to parse body:', e);
        }
      }
      console.log(`[apiFetch] Redirected OpenRouter to OpenAI: model gpt-5.4-mini`);
    }
  }
  const res = await fetch(url, options);
  return res.json();
}
