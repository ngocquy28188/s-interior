/* ════════════════════════════════════════════
   Banana AI — Default Config
   ════════════════════════════════════════════ */

// Local dev → absolute URL; production → relative (same domain via Vercel)
window.API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3100'
  : '';

window.BANANA_CONFIG = {
  // All API credentials (tokens, openrouter keys, and database logins)
  // are now managed directly on the intermediary router: https://api.slavii.com
};
