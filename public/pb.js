/* ════════════════════════════════════════════
   Banana AI — PocketBase SDK Sync Layer (Proxied via api.slavii.com)
   ════════════════════════════════════════════ */

// ── Auth Proxy ────────────────────────────────
window.pbLogin = async function(email, password) {
  // Login is now managed on the intermediary router (api.slavii.com)
  return true;
};

window.pbAutoLogin = async function() {
  // Automatically succeed on the client and rely on the router's auth
  return true;
};

window.pbLogout = function() {
  localStorage.removeItem('pb_creds');
};

window.pbIsLoggedIn = function() {
  return true; // Virtual login state via the API gateway
};

// ── Core CRUD via Router Gateway ──────────────

/** Load a keyed JSON blob from proxy */
window.pbLoad = async function(key, lsKey) {
  try {
    const res = await fetch(`${window.API || ''}/api/pb-load?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    const cloudData = data?.data ?? null;
    if (cloudData && lsKey) {
      localStorage.setItem(lsKey, JSON.stringify(cloudData));
    }
    return cloudData;
  } catch (err) {
    console.warn('[PB] Load proxied settings failed, falling back to localStorage:', err);
    const raw = lsKey ? localStorage.getItem(lsKey) : null;
    return raw ? JSON.parse(raw) : null;
  }
};

/** Save a keyed JSON blob via proxy */
window.pbSave = async function(key, data, lsKey) {
  if (lsKey) {
    localStorage.setItem(lsKey, JSON.stringify(data));
  }
  try {
    const res = await fetch(`${window.API || ''}/api/pb-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data }),
    });
    const resData = await res.json();
    return !!resData.success;
  } catch (err) {
    console.error('[PB] Save proxied settings failed:', err);
    return false;
  }
};

// ── Image Storage API via Router Gateway ───────

/** Ensure banana_images collection exists (handled by router) */
window.pbEnsureCollection = async function() {
  try {
    const res = await fetch(`${window.API || ''}/api/pb-create-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    console.log('[PB] Collection check:', data.message || 'checked');
  } catch (err) {
    console.warn('[PB] Collection check failed:', err.message);
  }
};

/** Save an image from external URL to PocketBase via proxy */
window.pbSaveImage = async function(imageUrl, metadata = {}) {
  try {
    const res = await fetch(`${window.API || ''}/api/save-to-pb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        prompt: metadata.prompt || '',
        model: metadata.model || '',
        ratio: metadata.ratio || '',
        folder_id: metadata.folder_id || 'root',
        tags: metadata.tags || [],
        source: metadata.source || 'generated',
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.error('[PB] Save image error:', data.error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[PB] Save image failed:', err.message);
    return null;
  }
};

/** List images from PocketBase via proxy */
window.pbListImages = async function(opts = {}) {
  try {
    const params = new URLSearchParams({
      folder_id: opts.folder_id || 'all',
      page: String(opts.page || 1),
      perPage: String(opts.perPage || 50),
    });
    if (opts.search) {
      params.set('search', opts.search);
    }
    const res = await fetch(`${window.API || ''}/api/pb-images?${params}`);
    return await res.json();
  } catch (err) {
    console.error('[PB] List images failed:', err.message);
    return { items: [], totalPages: 0, totalItems: 0 };
  }
};

/** Delete an image from PocketBase via proxy */
window.pbDeleteImage = async function(id) {
  try {
    const res = await fetch(`${window.API || ''}/api/pb-images/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('[PB] Delete image failed:', err.message);
    return false;
  }
};

/** Move image to different folder via proxy */
window.pbMoveImage = async function(id, folder_id) {
  try {
    const res = await fetch(`${window.API || ''}/api/pb-images/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id }),
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('[PB] Move image failed:', err.message);
    return false;
  }
};

/** Get persistent PB image URL from record */
window.pbGetImageUrl = function(record) {
  if (!record || !record.image) return null;
  return `https://db.mkg.vn/api/files/banana_images/${record.id}/${record.image}`;
};

// ── Init: run auto-login on page load ─────────
(async function init() {
  const ok = await window.pbAutoLogin();
  if (ok) {
    console.log('[PB] Auto-login success');
    await window.pbEnsureCollection();
    document.dispatchEvent(new Event('pb:ready'));
  } else {
    console.warn('[PB] Not logged in — using localStorage only');
    document.dispatchEvent(new Event('pb:offline'));
  }
})();
