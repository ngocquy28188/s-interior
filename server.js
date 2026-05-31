const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if it exists (for local dev)
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const CONFIG = {
  projectId: process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || '',
  authorization: process.env.GOOGLE_AUTHORIZATION || process.env.AUTHORIZATION || '',
  apiKey: process.env.MAX_STUDIO_API_KEY || process.env.API_KEY || '',
  openrouterKey: process.env.OPENROUTER_API_KEY || '',
  pbEmail: process.env.PB_EMAIL || '',
  pbPassword: process.env.PB_PASSWORD || '',
};

let _dbAuthToken = null;
let _dbAuthTokenExpires = 0;

async function getDbToken() {
  if (_dbAuthToken && _dbAuthTokenExpires > Date.now()) {
    return _dbAuthToken;
  }
  const finalEmail = CONFIG.pbEmail;
  const finalPassword = CONFIG.pbPassword;
  if (!finalEmail || !finalPassword) {
    throw new Error('Missing master PocketBase credentials in environment variables');
  }
  const data = await apiFetch('https://db.mkg.vn/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: finalEmail.trim(), password: finalPassword.trim() }),
  });
  if (!data.token) throw new Error('Master PocketBase auth failed: ' + JSON.stringify(data));
  _dbAuthToken = data.token;
  _dbAuthTokenExpires = Date.now() + 10 * 24 * 60 * 60 * 1000; // 10 days cache
  return _dbAuthToken;
}

let _cachedDbConfig = null;
let _cachedDbConfigTime = 0;

async function getDynamicConfig() {
  if (_cachedDbConfig && (Date.now() - _cachedDbConfigTime < 10000)) {
    return _cachedDbConfig;
  }

  try {
    const token = await getDbToken();
    const url = `https://db.mkg.vn/api/collections/banana_sync/records?filter=key="gateway_config"`;
    const searchRes = await apiFetch(url, {
      headers: { 'Authorization': token },
    });
    const record = searchRes.items?.[0];
    if (record && record.data) {
      _cachedDbConfig = {
        projectId: record.data.googleProjectId || record.data.projectId || CONFIG.projectId,
        authorization: record.data.googleAuth || record.data.authorization || CONFIG.authorization,
        apiKey: record.data.maxStudioKey || record.data.apiKey || CONFIG.apiKey,
        openrouterKey: record.data.openrouterKey || CONFIG.openrouterKey,
        pbEmail: record.data.pbEmail || CONFIG.pbEmail,
        pbPassword: record.data.pbPassword || CONFIG.pbPassword
      };
      _cachedDbConfigTime = Date.now();
      return _cachedDbConfig;
    }
  } catch (err) {
    console.warn('[CONFIG] Failed to load dynamic config from DB, using env fallback:', err.message);
  }

  return CONFIG;
}

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer error handler (e.g. file too large)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File quá lớn! Giới hạn 5MB/ảnh. Hãy nén ảnh trước khi upload.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  next(err);
});

// ────── Helpers ──────

function cleanPrompt(str) {
  if (!str) return '';
  return str
    .normalize('NFC')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    // Strip all non-ASCII chars to prevent ByteString API errors
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function apiFetch(url, options = {}) {
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
          // gpt-5.4-mini requires max_completion_tokens instead of max_tokens
          if ('max_tokens' in bodyObj) {
            bodyObj.max_completion_tokens = bodyObj.max_tokens;
            delete bodyObj.max_tokens;
          }
          // response_format json_object not supported — remove it
          if (bodyObj.response_format?.type === 'json_object') {
            delete bodyObj.response_format;
          }
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          console.error('[apiFetch rewrite] failed to parse body:', e);
        }
      }
      console.log(`[apiFetch] Redirected OpenRouter to OpenAI: model gpt-5.4-mini`);
    }
  }
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    console.log(`[API FETCH RESULT] ${url}:`, text.substring(0, 500));
    if (!res.ok) {
      console.warn(`[API FETCH WARNING] ${url} HTTP ${res.status}: ${text}`);
      // return data to allow downstream to handle the error structure if it's JSON
      return data;
    }
    return data;
  } catch (err) {
    const headText = text.substring(0, 150).replace(/(\r\n|\n|\r)/gm, " ");
    const errMsg = `Upstream API error (${res.status}): ${headText}`;
    console.error(`[API FETCH ERROR] ${url} failed to parse JSON:`, headText);
    throw new Error(errMsg);
  }
}

// ────── Existing API Routes ──────

/** POST /api/text-to-image */
app.post('/api/text-to-image', async (req, res) => {
  try {
    const { prompt, ratio, quantity, model, projectId, authorization, apiKey } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalProjectId = (projectId && projectId.trim()) ? projectId : activeConfig.projectId;
    const finalAuth = (authorization && authorization.trim()) ? authorization : activeConfig.authorization;
    const finalApiKey = (apiKey && apiKey.trim()) ? apiKey : activeConfig.apiKey;

    const cleaned = cleanPrompt(prompt);
    const data = await apiFetch('https://max-studio.online/api/v1/create-task/text-to-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': finalApiKey },
      body: JSON.stringify({ prompt: cleaned, ratio, quantity: Number(quantity), model, jwt: finalAuth, seed: 10000, projectId: finalProjectId }),
    });
    if ((!data.taskid && !data.taskId) && (data.message || data.error || data.detail)) {
      return res.status(400).json({ error: data.message || data.error || data.detail, raw: data });
    }
    res.json(data);
  } catch (err) {
    console.error('text-to-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/upload-image */
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { projectId, authorization } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalProjectId = (projectId && projectId.trim()) ? projectId : activeConfig.projectId;
    const finalAuth = (authorization && authorization.trim()) ? authorization : activeConfig.authorization;

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image file provided' });
    const base64 = file.buffer.toString('base64');
    const data = await apiFetch('https://aisandbox-pa.googleapis.com/v1/flow/uploadImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${finalAuth}` },
      body: JSON.stringify({
        clientContext: { projectId: finalProjectId, tool: 'PINHOLE' },
        imageBytes: base64, isUserUploaded: true, isHidden: false,
        mimeType: file.mimetype, fileName: file.originalname,
      }),
    });
    res.json(data);
  } catch (err) {
    console.error('upload-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/image-to-image */
app.post('/api/image-to-image', async (req, res) => {
  try {
    const { prompt, quantity, ratio, model, mediaId, projectId, authorization, apiKey } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalProjectId = (projectId && projectId.trim()) ? projectId : activeConfig.projectId;
    const finalAuth = (authorization && authorization.trim()) ? authorization : activeConfig.authorization;
    const finalApiKey = (apiKey && apiKey.trim()) ? apiKey : activeConfig.apiKey;

    const cleaned = cleanPrompt(prompt);
    const data = await apiFetch('https://max-studio.online/api/v1/create-task/image-to-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': finalApiKey },
      body: JSON.stringify({ prompt: cleaned, quantity: Number(quantity), ratio, model, mediaId, projectId: finalProjectId, seed: 10000, jwt: finalAuth }),
    });
    if ((!data.taskid && !data.taskId) && (data.message || data.error || data.detail)) {
      return res.status(400).json({ error: data.message || data.error || data.detail, raw: data });
    }
    res.json(data);
  } catch (err) {
    console.error('image-to-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/check-status/:taskId */
app.get('/api/check-status/:taskId', async (req, res) => {
  try {
    const activeConfig = await getDynamicConfig();
    const apiKey = req.headers['x-api-key'] || activeConfig.apiKey;
    const data = await apiFetch(`https://max-studio.online/api/v1/check-status/${req.params.taskId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    res.json(data);
  } catch (err) {
    console.error('check-status error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/upscale */
app.post('/api/upscale', async (req, res) => {
  try {
    const { resolution, ratio, mediaId, authorization, projectId, apiKey } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalProjectId = (projectId && projectId.trim()) ? projectId : activeConfig.projectId;
    const finalAuth = (authorization && authorization.trim()) ? authorization : activeConfig.authorization;
    const finalApiKey = (apiKey && apiKey.trim()) ? apiKey : activeConfig.apiKey;

    const data = await apiFetch('https://max-studio.online/api/v1/create-task/upscale-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': finalApiKey },
      body: JSON.stringify({ resolution: resolution || '4K', ratio, media_id: mediaId, jwt: finalAuth, projectId: finalProjectId }),
    });
    if ((!data.taskid && !data.taskId) && (data.message || data.error || data.detail)) {
      return res.status(400).json({ error: data.message || data.error || data.detail, raw: data });
    }
    res.json(data);
  } catch (err) {
    console.error('upscale error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** Proxy image download */
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).json({ error: 'Missing url param' });
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    console.error('proxy-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── NEW: AI Analyze Image (OpenRouter GPT-4o-mini) ──────

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const { steps, openrouterKey, currentPrompt, mode } = req.body || {};
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    const file = req.file;

    if (!finalOpenRouterKey || finalOpenRouterKey.trim() === '') {
      return res.status(400).json({ error: 'Missing OpenRouter API key' });
    }

    // ── MODE: rewrite — extract subject then combine with existing prompt ──
    if (mode === 'rewrite') {
      if (!file) return res.status(400).json({ error: 'Missing image' });
      const base64 = file.buffer.toString('base64');
      const subjectType = req.body.subjectType || 'product'; // product | furniture | decor | space | object
      const hasPrompt = currentPrompt && currentPrompt.trim().length > 10;

      const systemText = hasPrompt
        ? `You are an AI image prompt engineer specializing in product photography.
Your task has TWO parts:

PART 1 — Analyze the image to extract ONLY the main subject:
- Identify: exact product name, material/texture, colors, key visual features, finish/surface
- Subject type hint: "${subjectType}"
- Be specific and concise (1-2 sentences describing the subject)

PART 2 — Combine with existing prompt:
Existing prompt (contains camera angle, lighting, space, render style): """${currentPrompt}"""
- KEEP everything about: camera angle, lighting setup, room/background, render style, photography technique
- REPLACE ONLY the subject/product description with what you identified in Part 1
- The final prompt must flow naturally in English

Return ONLY valid JSON: {"subject": "brief subject description", "rewrittenPrompt": "full combined prompt"}`
        : `You are an AI image prompt engineer.
Analyze this image and identify the main subject (type hint: "${subjectType}"):
- Product name, material, colors, key visual features

Write a professional product photography prompt in English based on what you see.
Return ONLY valid JSON: {"subject": "brief subject description", "rewrittenPrompt": "detailed photography prompt"}`;

      const content = [
        { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}` } },
        { type: 'text', text: systemText },
      ];

      const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${finalOpenRouterKey.trim()}`, 'HTTP-Referer': 'https://img.mkg.vn', 'X-Title': 'Banana AI' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content }], max_tokens: 1000, temperature: 0.5, response_format: { type: 'json_object' } }),
      });
      const reply = data.choices?.[0]?.message?.content || '{}';
      try { return res.json(JSON.parse(reply)); } catch { return res.json({ rewrittenPrompt: currentPrompt }); }
    }

    // ── MODE: default — Pro Pipeline step analysis ──
    const parsedSteps = JSON.parse(steps || '[]');


    // Build content array
    const content = [];

    // If image provided, add it
    if (file) {
      const base64 = file.buffer.toString('base64');
      content.push({
        type: 'image_url',
        image_url: { url: `data:${file.mimetype};base64,${base64}` },
      });
    }

    const stepsList = parsedSteps.map((s, i) => `Step ${i + 1} "${s.name}": ${s.prompt || '(empty)'}`).join('\n');

    content.push({
      type: 'text',
      text: `You are an expert AI image generation prompt engineer. Your task:

1. Analyze the uploaded reference image carefully to identify the specific PRODUCT or SUBJECT (type of object, key characteristics, materials, colors, design style).
2. For each pipeline step below, read the provided existing prompt.
3. YOUR GOAL is to REPLACE the old product/subject description in the existing prompt with the NEW product from the reference image.
4. CRITICAL: You MUST KEEP the exact same structure, camera angle, lighting, background, and rendering style of the original prompt. ONLY swap out the product/subject details.
5. Keep prompts in English. Ensure the integrated prompt flows naturally.
6. Return ONLY valid JSON array, no markdown, no explanation.

Pipeline steps:
${stepsList}

Return format: [{"name": "Step Name", "improvedPrompt": "detailed prompt here"}, ...]`
    });

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Auto Google Banana',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (data.error) {
      return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) });
    }

    // Parse the response
    const reply = data.choices?.[0]?.message?.content || '';

    // Extract JSON from reply (handle markdown code blocks)
    let jsonStr = reply;
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const improved = JSON.parse(jsonStr);
      res.json({ steps: improved });
    } catch {
      res.json({ steps: parsedSteps, raw: reply, warning: 'Could not parse AI response as JSON' });
    }
  } catch (err) {
    console.error('analyze-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── Curtain Prompt Generator ──────
app.post('/api/curtain-prompt', upload.single('image'), async (req, res) => {
  try {
    const { curtainType, curtainColor, installStyle, openrouterKey } = req.body || {};
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    const file = req.file;

    if (!finalOpenRouterKey || finalOpenRouterKey.trim() === '') {
      return res.status(400).json({ error: 'Missing OpenRouter API key' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Missing image file' });
    }

    const base64 = file.buffer.toString('base64');
    const systemText = `You are a professional interior design rendering prompt architect.
Analyze the uploaded image of the room and write a detailed photorealistic rendering prompt in English to replace or add curtains into the windows of this specific room.

Your prompt MUST:
1. Describe the room's key features (layout, furniture, flooring, walls, lighting direction) visible in the image to maintain structural and aesthetic consistency.
2. Describe the newly installed curtains in detail:
   - Curtain Type: ${curtainType || 'standard curtain'}
   - Color & Fabric: ${curtainColor || 'selected color'}
   - Installation Style: ${installStyle || 'standard mounting'}
3. Ensure the prompt describes a natural, photorealistic image, with the curtains fitting perfectly and neatly on the windows under the lighting condition of the room.
4. Keep the prompt concise, professional, and written in English.

Return ONLY a valid JSON object: {"prompt": "your detailed prompt here"}`;

    const content = [
      { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}` } },
      { type: 'text', text: systemText },
    ];

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Curtains AI Prompt Gen',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content }],
        max_tokens: 1000,
        temperature: 0.5,
        response_format: { type: 'json_object' }
      }),
    });

    if (data.error) {
      return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) });
    }

    const reply = data.choices?.[0]?.message?.content || '{}';
    try {
      res.json(JSON.parse(reply));
    } catch {
      res.status(500).json({ error: 'Failed to parse JSON reply from AI model', raw: reply });
    }
  } catch (err) {
    console.error('curtain-prompt error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── Interior Prompt Generator ──────
app.post('/api/interior-prompt', upload.single('image'), async (req, res) => {
  try {
    const { roomType, colorPalette, designStyle, openrouterKey, subject, time } = req.body || {};
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    const file = req.file;

    if (!finalOpenRouterKey || finalOpenRouterKey.trim() === '') {
      return res.status(400).json({ error: 'Missing OpenRouter API key' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Missing image file' });
    }

    const base64 = file.buffer.toString('base64');
    const isLivedIn = designStyle.toLowerCase().includes('lived-in') || designStyle.toLowerCase().includes('thực tế');
    const systemText = `You are a professional interior design rendering prompt architect.
Analyze the uploaded image of the room and write a detailed, high-resolution photorealistic rendering prompt in English to redesign and furnish the space based on the requested options.

Your prompt MUST:
1. Identify and describe the existing room structure (walls, floor type, windows, ceiling) visible in the image to maintain layout and perspective consistency.
2. Describe the newly designed interior in detail:
   - Space Type / Function: ${roomType || 'modern room'}
   - Main Color Palette & Materials: ${colorPalette || 'neutral tones'}
   - Design Style: ${designStyle || 'contemporary'}
3. ${isLivedIn ? `Ensure the prompt describes a raw, real-life, authentic candid photo of a lived-in space (not a clean 3D render). The photo MUST feature a real Vietnamese ${subject || 'person'} (candid, authentic everyday Vietnamese appearance with realistic local features, definitely NOT looking like a typical AI-generated model face or a generic Western person). IMPORTANT: The age of the subject MUST match the selected character (if a child/boy/girl is selected, describe a young child around 5-10 years old; do NOT describe an adult). They must be active in the room (doing natural daily activities like studying, working, playing, or relaxing naturally during the ${time || 'daytime/nighttime'}, not posing). The room MUST contain realistic everyday elements like electrical wall outlets with visible power cords/plugs on the walls, and slightly messy/cluttered belongings scattered around naturally to create a realistic daily life atmosphere.` : `Ensure the prompt describes a natural, photorealistic, cohesive interior design, featuring premium furniture arrangement, warm ambient lighting, and high-end styling details that match the selected style.`}
4. Keep the prompt concise, professional, and written in English.

Return ONLY a valid JSON object: {"prompt": "your detailed prompt here"}`;

    const content = [
      { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}` } },
      { type: 'text', text: systemText },
    ];

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Interior AI Prompt Gen',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content }],
        max_tokens: 1000,
        temperature: 0.5,
        response_format: { type: 'json_object' }
      }),
    });

    if (data.error) {
      return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) });
    }

    const reply = data.choices?.[0]?.message?.content || '{}';
    try {
      res.json(JSON.parse(reply));
    } catch {
      res.status(500).json({ error: 'Failed to parse JSON reply from AI model', raw: reply });
    }
  } catch (err) {
    console.error('interior-prompt error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ────── Material Restyle Prompt Generator ──────
app.post('/api/restyle-prompt', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'textureImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { materialName, materialDesc, openrouterKey } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    const files = req.files || {};
    const mainFile = (files.mainImage || [])[0];
    const texFile  = (files.textureImage || [])[0];

    if (!finalOpenRouterKey?.trim()) return res.status(400).json({ error: 'Missing OpenRouter key' });
    if (!mainFile) return res.status(400).json({ error: 'Missing main image' });
    if (!materialName) return res.status(400).json({ error: 'Missing material name' });

    const mainB64 = mainFile.buffer.toString('base64');
    const content = [
      { type: 'image_url', image_url: { url: `data:${mainFile.mimetype};base64,${mainB64}` } },
    ];
    if (texFile) {
      const texB64 = texFile.buffer.toString('base64');
      content.push({ type: 'image_url', image_url: { url: `data:${texFile.mimetype};base64,${texB64}` } });
      content.push({ type: 'text', text: `The second image above is the TARGET TEXTURE/MATERIAL to apply.` });
    }
    content.push({ type: 'text', text: `You are an expert AI image generation prompt engineer.

Analyze the FIRST image carefully and:
1. Identify the MAIN SUBJECT (the primary object/furniture/product in the scene)
2. Note EXACTLY: camera angle, lighting, background, room setting, composition, shadows, reflections
3. Note the current material/finish of the main subject

Your task: Write an image generation prompt that recreates this EXACT scene but with the main subject's material/surface changed to: "${materialName}" (${materialDesc || materialName}).

STRICT RULES:
- DO NOT change: camera angle, lighting direction, background, room decor, composition, other objects, shadows
- DO NOT change: the shape, size, or proportions of the main subject
- ONLY change: the material, texture, surface finish of the main subject
- The prompt must be extremely precise about preserving the original scene
- Write as if describing a photorealistic render
- Keep prompt in English

Return ONLY valid JSON: {"prompt": "full detailed image generation prompt", "subject": "what the main subject is"}`
    });

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${finalOpenRouterKey.trim()}`, 'HTTP-Referer': 'https://img.mkg.vn', 'X-Title': 'Banana AI Restyle' },
      body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content }], max_tokens: 800, temperature: 0.4, response_format: { type: 'json_object' } }),
    });
    if (data.error) return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) });
    const reply = data.choices?.[0]?.message?.content || '{}';
    try { return res.json(JSON.parse(reply)); } catch { return res.json({ prompt: '', subject: '' }); }
  } catch (err) {
    console.error('restyle-prompt error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── Concept Sync: Unify style/material across multiple images ──────
app.post('/api/concept-sync', upload.fields([{ name: 'referenceImage', maxCount: 1 }, { name: 'targetImages', maxCount: 20 }]), async (req, res) => {
  try {
    const { openrouterKey } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    const files = req.files || {};
    const refFile = (files.referenceImage || [])[0];
    const targetFiles = files.targetImages || [];

    if (!finalOpenRouterKey?.trim()) return res.status(400).json({ error: 'Missing OpenRouter API key' });
    if (!refFile) return res.status(400).json({ error: 'Missing reference image' });
    if (!targetFiles.length) return res.status(400).json({ error: 'No target images provided' });

    const refB64 = refFile.buffer.toString('base64');

    // ── Step 1: Extract Style DNA from reference image ──
    const dnaResponse = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Banana AI Concept Sync',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${refFile.mimetype};base64,${refB64}` } },
            { type: 'text', text: `You are an expert interior design analyst. Analyze this reference interior image and extract the design DNA.

Return ONLY valid JSON with these EXACT fields:
{
  "design_style": "the interior design style (e.g. Japandi, Scandinavian, Modern Minimalist, Luxury Classic)",
  "wood_type": "specific wood used (e.g. light oak, walnut, whitewash pine, none)",
  "primary_palette": "main color palette (e.g. warm neutrals: beige, cream, taupe)",
  "accent_color": "accent/highlight color if any (e.g. matte black, gold, terracotta)",
  "material_finish": "dominant surface finishes (e.g. matte wood, brushed metal, linen fabric)",
  "lighting_style": "lighting character (e.g. warm natural daylight, dramatic moody, soft ambient)",
  "atmosphere": "overall feel (e.g. minimalist serene, cozy warm, luxurious bold)",
  "style_summary": "one concise sentence describing the unified concept for prompt injection"
}` },
          ],
        }],
        max_tokens: 600,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const dnaRaw = dnaResponse.choices?.[0]?.message?.content || '{}';
    let styleDNA;
    try { styleDNA = JSON.parse(dnaRaw); } catch { styleDNA = { style_summary: 'unified interior style matching the reference image' }; }

    // ── Step 2: Generate unified prompt for each target image ──
    const results = [];
    for (let i = 0; i < targetFiles.length; i++) {
      const tFile = targetFiles[i];
      const tB64 = tFile.buffer.toString('base64');

      const targetResponse = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
          'HTTP-Referer': 'https://img.mkg.vn',
          'X-Title': 'Banana AI Concept Sync',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${tFile.mimetype};base64,${tB64}` } },
              { type: 'text', text: `You are an expert AI image generation prompt engineer.

This image shows a furniture/interior piece that needs to be re-rendered to match a specific design concept.

TARGET DESIGN DNA (apply this to the image):
- Design Style: ${styleDNA.design_style || 'modern minimalist'}
- Wood Type: ${styleDNA.wood_type || 'natural oak'}
- Primary Palette: ${styleDNA.primary_palette || 'warm neutrals'}
- Accent Color: ${styleDNA.accent_color || 'none'}
- Material Finish: ${styleDNA.material_finish || 'matte natural'}
- Lighting Style: ${styleDNA.lighting_style || 'warm natural daylight'}
- Atmosphere: ${styleDNA.atmosphere || 'minimalist serene'}
- Concept: ${styleDNA.style_summary || 'unified home concept'}

Your task:
1. Identify the MAIN SUBJECT in the image (the primary furniture/décor item)
2. Note the camera angle, composition, and room layout EXACTLY
3. Write an image generation prompt that:
   - KEEPS: the exact same furniture/object TYPE, shape, camera angle, composition
   - CHANGES: materials, colors, wood type, finishes to match the TARGET DESIGN DNA above
   - ADDS: lighting, atmosphere, background elements consistent with the design DNA
   - RESULT: looks like it belongs to the SAME home/concept as the reference

Return ONLY valid JSON:
{
  "subject": "brief description of main subject",
  "prompt": "complete detailed image generation prompt in English, photorealistic, including all camera, lighting, and material details"
}` },
            ],
          }],
          max_tokens: 700,
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });

      const targetRaw = targetResponse.choices?.[0]?.message?.content || '{}';
      let targetResult;
      try { targetResult = JSON.parse(targetRaw); } catch { targetResult = { subject: 'Unknown', prompt: '' }; }
      results.push({ index: i, subject: targetResult.subject || '', prompt: targetResult.prompt || '' });
    }

    res.json({ styleDNA, results });
  } catch (err) {
    console.error('concept-sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── Prompt Generator: Generate interior prompts ──────
app.post('/api/generate-prompts', upload.array('images', 20), async (req, res) => {
  try {
    const { openrouterKey, config: configRaw, productDesc } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    if (!finalOpenRouterKey) return res.status(400).json({ error: 'Missing OpenRouter key' });
    const config = JSON.parse(configRaw || '{}');
    const files = req.files || [];

    const variationInstruction = config.autoColorVariants ? `
CRITICAL INSTRUCTION FOR COLOR VARIANTS:
The user has requested 3 color/material variations per angle.
For EACH camera angle requested, you MUST generate 3 distinct scenes:
1. "Màu vân gỗ sáng (Light Oak Wood)"
2. "Màu vân gỗ tối (Dark Walnut Wood)"
3. "Màu sơn trắng (White Finish)"
Thus, if 4 angles are requested, you must return 12 scenes total. Clearly label the view_title to include the color variant.
` : '';

    const subjectConstraint = config.subjectType === 'product' ? 'a studio product photography set' : `a ${config.roomType || 'living-room'} interior`;

    const systemPrompt = `You are a professional interior design visualizer and AI rendering prompt architect.
Your task: Generate image prompts for ${subjectConstraint}.

CONFIGURATION:
- Render Style: ${config.renderStyle || 'photorealistic'}
- Color Palette: ${config.colorPalette || 'warm-neutral'}
- Atmosphere: ${config.atmosphere || 'minimalist'}
${config.subjectType === 'interior' ? `- Room Type: ${config.roomType || 'living-room'}\n- Room Size: ${config.roomSize || 'medium'}\n- Ceiling Height: ${config.ceilingHeight || '2.7m'}` : ''}
- Lighting: ${config.lightingMood || 'warm-daylight'}
- Light Direction: ${config.lightDirection || 'left-window'}
- Camera Lens: ${config.cameraLens || '35mm'}
- Camera Angles Requested: ${(config.cameraAngles || []).join(' | ')}
- Camera Height: ${config.cameraHeight || 'eye-level'}
${config.notes ? `- Notes: ${config.notes}` : ''}

CRITICAL RULES:
1. ABSOLUTELY DO NOT change the existing elements in the room (furniture, curtains, decor, house structure). They MUST be preserved exactly as they are.
2. ONLY change the camera angle, framing, and focus (as specified in Camera Angles).
3. For macro/detail angles, use the following style as reference:
   "A macro, shallow depth of field photograph focusing intensely on the junction of materials on the nightstand from image_14.png. The focus is sharply on the boundary between the smooth matte white painted frame and the fine, natural grain of the light oak wood top. Details of the wood pores and the precise paint finish are magnified. A portion of the brass lamp base is out of focus. Lighting is side-angled to create texture-revealing shadows."

${variationInstruction}

If product images are provided, analyze them and recreate them faithfully in the prompts (materials, colors, textures).
Return ONLY valid JSON in the format:
{
  "scenes": [
    {
      "scene_number": 1,
      "view_title": "angle name",
      "image_prompt": "Complete, self-contained prompt including render style, products, lighting, camera"
    }
  ]
}`;

    const userContent = [];
    if (productDesc) userContent.push({ type: 'text', text: `Product description: ${productDesc}` });
    files.forEach((f, i) => {
      const b64 = f.buffer.toString('base64');
      const mime = f.mimetype;
      userContent.push({ type: 'text', text: `[Product Image ${i + 1}]` });
      userContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'high' } });
    });
    if (!userContent.length) userContent.push({ type: 'text', text: 'No specific product — create a beautiful generic interior scene.' });

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Banana AI Prompt Gen',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      }),
    });

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from GPT');
    const result = JSON.parse(content);
    res.json(result);
  } catch (err) {
    console.error('[generate-prompts]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────── Multi-Angle: Synthesize space and generate strictly preserved angle prompts ──────
app.post('/api/generate-angles', upload.array('images', 2), async (req, res) => {
  try {
    const { openrouterKey, angles: anglesRaw } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    if (!finalOpenRouterKey) return res.status(400).json({ error: 'Missing OpenRouter key' });
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'Requires at least 1 room image' });
    
    let requestedAngles = [];
    try { requestedAngles = JSON.parse(anglesRaw || '[]'); } catch { requestedAngles = ['Toàn cảnh']; }
    if (!requestedAngles.length) requestedAngles = ['Toàn cảnh'];

    const systemPrompt = `You are a world-class architectural visualizer, 3D space mapper, and AI rendering prompt engineer for Nano_Banana_Pro.
Your task: The user provides interior room photos. You must conceptually rebuild this room in 3D space, analyzing carefully and precisely every detail to maintain 100% consistency across all views:
1. Structural details: position of doors, windows, natural lighting source, ceiling height.
2. Materials: exact wood grain and color of the floor (sàn gỗ), wall texture/color, rug layout.
3. Furniture & Layout: exact placement, color, material, and spatial relationship of the bed, sofa, tables, cabinets.
4. Decorations: plants, lamps, wall art, small objects.

CRITICAL INSTRUCTIONS FOR ANGLES:
- The user is extracting multiple angles of this EXACT same room.
- Each requested camera angle MUST produce a drastically different framing and composition to avoid duplicate-looking images. 
- For example, "Top-down" MUST explicitly state "Aerial top-down view looking straight down at the floor plan". "Từ trong góc phòng" MUST state "Wide angle shot from the farthest corner of the room looking outwards". "Từ hướng ngược lại" MUST state "Reverse angle shot looking from the opposite side back towards the original camera position".
- SPECIAL CASE "Mood Board": If the user requests "Tạo Mood Board", the prompt MUST strictly describe a highly professional, aesthetic interior design flat-lay mood board presentation. It must feature physical material swatches, wood grains matching the floor/furniture, fabric samples, a curated color palette, and key object clippings from the room symmetrically arranged on a neutral canvas like an editorial magazine presentation.
- DO NOT just copy-paste the same generic room description. Describe the room functionally from that specific physical camera position, stating clearly what objects are in the foreground, midground, and background for THAT specific framing.
- The prompt MUST be in English, photorealistic, and explicitly formatted for text-to-image AI generation.

Return ONLY valid JSON in this exact format:
{
  "scenes": [
    {
      "angle_name": "Name of the requested angle",
      "image_prompt": "Detailed English prompt stating the specific camera angle/viewpoint first, followed by the meticulously preserved materials, furniture, flooring, doors, windows, and decorations visible from this vantage point."
    }
  ]
}`;

    const userContent = [{ type: 'text', text: `Requested camera angles: ${requestedAngles.join(', ')}` }];
    files.forEach((f, i) => {
      const b64 = f.buffer.toString('base64');
      const mime = f.mimetype;
      userContent.push({ type: 'text', text: `[Reference Image ${i + 1}]` });
      userContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'high' } });
    });

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Banana AI Multi Angle',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2, // Low temperature for high fidelity/preservation
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      }),
    });

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from GPT');
    const result = JSON.parse(content);
    res.json(result);
  } catch (err) {
    console.error('[generate-angles]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────── Process Generator: Auto-generate construction workflow from empty room ──────
app.post('/api/generate-process', upload.fields([{ name: 'emptyRoom', maxCount: 1 }, { name: 'finalImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { openrouterKey, config: configRaw } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    if (!finalOpenRouterKey) return res.status(400).json({ error: 'Missing OpenRouter key' });
    const config = JSON.parse(configRaw || '{}');
    const files = req.files || {};
    const hasEmptyRoom = files.emptyRoom && files.emptyRoom.length > 0;
    const hasFinalImage = files.finalImage && files.finalImage.length > 0;

    if (!hasEmptyRoom) return res.status(400).json({ error: 'Bắt buộc phải có ảnh mặt bằng trống (Empty Room)' });

    let systemPrompt = `You are an expert interior design visualizer and architectural prompt engineer.
The user is building a "Construction Process Journey" (Quy trình thi công) showcase.

INPUT:
1. An image of an EMPTY or OLD room (Image 1 / Empty Room).`;

    if (hasFinalImage) {
      systemPrompt += `\n2. An image of the FINISHED interior design (Image 2 / Final Image).`;
    }

    systemPrompt += `

YOUR TASK:
Generate highly detailed, photorealistic text-to-image prompts for the intermediate stages of construction.
These images MUST perfectly match the room's layout, perspective, and camera angle as seen in the EMPTY ROOM image.

STAGES TO GENERATE:
1. "Mặt bằng ban đầu" (Original Empty Room): The prompt MUST explicitly describe a completely EMPTY and BARE room. Absolutely NO FURNITURE, NO BEDS, NO DECOR. Describe only the bare empty space, walls, floor, and structural elements like windows and doors.
2. "Khảo sát và Đo đạc" (Measurement & Surveying): The same empty room, but with 1 or 2 construction engineers. It should look a bit messy with construction blueprints, measuring tools, and drawing papers scattered or thrown casually on the bare floor.
3. "Tập kết nội thất" (Furniture Delivery): The room is still unfinished but filled with large wooden crates, carton boxes, and packed furniture modules being delivered and moved up into the space.
4. "Lắp đặt gần hoàn thiện" (Installation Almost Finished): The room is almost fully furnished matching the Final Image, but it is currently mid-installation. It looks messy with some half-installed furniture, tools on the floor, protective covers, and open crates. CRITICAL: The prompt MUST explicitly state to preserve the exact same window structure, ceiling, curtains, and wooden floor from the finished design.
5. "Hoàn thiện thực tế" (Finished Reality): `;

    if (hasFinalImage) {
      systemPrompt += `The finished room exactly matching the SECOND IMAGE provided (Final Image).`;
    } else {
      systemPrompt += `The finished room fully furnished and decorated according to this style:
- Style: ${config.style || 'Modern Minimalist'}
- Room Type: ${config.roomType || 'Living Room'}
- Color Palette: ${config.colors || 'Warm Neutrals'}
- Additional Notes: ${config.notes || 'None'}`;
    }

    systemPrompt += `

CRITICAL INSTRUCTIONS:
- You MUST maintain the EXACT SAME camera angle, perspective, window/door placements AND proportions, and structural boundaries as the EMPTY ROOM in ALL generated prompts.
- Do NOT change the position or size of the windows.
- You MUST keep the original ceiling structure (e.g., gypsum ceiling lines), the original flooring (e.g., wooden floor color), and EXACTLY the same curtains perfectly preserved and identical between images.
- All prompts must be in English, descriptive, and optimized for an AI image generator like Midjourney or stable-diffusion.
- Avoid text in images.

Return ONLY a valid JSON object in this format:
{
  "scenes": [
    {
      "step_id": "step_1_original",
      "step_name": "🏚️ Mặt bằng hiện trạng",
      "image_prompt": "English prompt for empty room..."
    },
    {
      "step_id": "step_2_measurement",
      "step_name": "📐 Đo đạc khảo sát",
      "image_prompt": "English prompt for surveying, messy with drawing papers on floor..."
    },
    {
      "step_id": "step_3_delivery",
      "step_name": "📦 Tập kết nội thất",
      "image_prompt": "English prompt for wooden crates and boxes delivered..."
    },
    {
      "step_id": "step_4_installation",
      "step_name": "🔨 Lắp đặt bề bộn",
      "image_prompt": "English prompt for almost finished installation with tools and mess..."
    },
    {
      "step_id": "step_5_final",
      "step_name": "✨ Hoàn thiện thực tế",
      "image_prompt": "English prompt for final result..."
    }
  ]
}`;

    const userContent = [];
    userContent.push({ type: 'text', text: `[Image 1: Empty Room]` });
    const emptyFile = files.emptyRoom[0];
    const emptyB64 = emptyFile.buffer.toString('base64');
    userContent.push({ type: 'image_url', image_url: { url: `data:${emptyFile.mimetype};base64,${emptyB64}`, detail: 'high' } });

    if (hasFinalImage) {
      userContent.push({ type: 'text', text: `[Image 2: Final Finished Room]` });
      const finalFile = files.finalImage[0];
      const finalB64 = finalFile.buffer.toString('base64');
      userContent.push({ type: 'image_url', image_url: { url: `data:${finalFile.mimetype};base64,${finalB64}`, detail: 'high' } });
    }

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Banana AI Process Generator',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from GPT');
    const result = JSON.parse(content);
    res.json(result);
  } catch (err) {
    console.error('[generate-process]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────── MODI: Fetch valid categories from PB schema ──────
app.post('/api/modi-categories', async (req, res) => {
  try {
    const { pbEmail, pbPassword } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalEmail = pbEmail || activeConfig.pbEmail;
    const finalPassword = pbPassword || activeConfig.pbPassword;
    if (!finalEmail || !finalPassword) return res.status(400).json({ error: 'Missing credentials' });
    const authData = await apiFetch('https://db.mkg.vn/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: finalEmail.trim(), password: finalPassword.trim() }),
    });
    if (!authData.token) return res.status(401).json({ error: 'Auth failed' });
    const schema = await apiFetch('https://db.mkg.vn/api/collections/modi_products', {
      headers: { 'Authorization': authData.token },
    });
    const fields = schema.fields || schema.schema || [];
    const catField = fields.find(f => f.name === 'category');
    const options = catField?.options?.values || catField?.values || [];
    res.json({ options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────── MODI: Analyze product image ──────
app.post('/api/modi-analyze', upload.single('image'), async (req, res) => {
  try {
    const { openrouterKey } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalOpenRouterKey = (openrouterKey && openrouterKey.trim()) ? openrouterKey : activeConfig.openrouterKey;
    const file = req.file;
    if (!finalOpenRouterKey || !finalOpenRouterKey.trim()) return res.status(400).json({ error: 'Missing OpenRouter API key' });
    if (!file) return res.status(400).json({ error: 'Missing image file' });

    const base64 = file.buffer.toString('base64');
    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalOpenRouterKey.trim()}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Auto Google Banana',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Bạn là chuyên gia SEO Content Nội thất. Phân tích hình ảnh, tạo thông tin tối ưu Google Search. CHỈ trả về JSON thuần, KHÔNG bọc markdown. Cấu trúc: {"name": "Tên SP chứa keyword SEO", "slug": "ten-sp-chua-keyword-khong-dau", "description": "Một bài đánh giá dài 150-300 chữ, hành văn sắc sảo, lôi cuốn, nhấn mạnh vào chất liệu và công năng để tối ưu SEO Google, có chèn keyword", "features": ["Tính năng nổi bật 1", "Tính năng 2", "Tính năng 3"], "colors": ["Màu 1", "Màu 2"], "dimensions": "Rộng x Sâu x Cao mm"}'
            },
            { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}` } }
          ]
        }],
        max_tokens: 1500,
      }),
    });

    if (data.error) return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) });

    let raw = data.choices?.[0]?.message?.content || '';
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      res.json(JSON.parse(raw));
    } catch {
      res.status(400).json({ error: 'AI không trả về JSON hợp lệ', raw });
    }
  } catch (err) {
    console.error('modi-analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── MODI: Export product to PocketBase ──────
app.post('/api/modi-export', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'subImages', maxCount: 20 }]), async (req, res) => {
  try {
    const { name, slug, sku, salePrice, price, category, material, dimensions, description, colors, features, pbEmail, pbPassword } = req.body;
    const activeConfig = await getDynamicConfig();
    const finalEmail = pbEmail || activeConfig.pbEmail;
    const finalPassword = pbPassword || activeConfig.pbPassword;
    if (!finalEmail || !finalPassword) return res.status(400).json({ error: 'Missing PocketBase credentials' });
    if (!name || !slug) return res.status(400).json({ error: 'Thiếu tên hoặc slug sản phẩm' });

    // Safely parse arrays
    let parsedColors = [], parsedFeatures = [];
    try { parsedColors = typeof colors === 'string' ? JSON.parse(colors) : (colors || []); } catch { parsedColors = []; }
    try { parsedFeatures = typeof features === 'string' ? JSON.parse(features) : (features || []); } catch { parsedFeatures = []; }

    // Step 1: Auth PocketBase
    console.log('[MODI Export] Authenticating PocketBase...');
    const authData = await apiFetch('https://db.mkg.vn/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: finalEmail.trim(), password: finalPassword.trim() }),
    });
    console.log('[MODI Export] Auth result:', authData.token ? 'OK' : JSON.stringify(authData));
    if (!authData.token) return res.status(401).json({ error: 'PocketBase auth thất bại: ' + (authData.message || JSON.stringify(authData)) });
    const token = authData.token;

    // Step 2: Create product record
    const recordBody = {
      name: name.trim(),
      slug: slug.trim(),
      sku: (sku || '').trim(),
      category: category || 'COMBO',
      material: material || 'MDF',
      salePrice: Number(salePrice) || 0,
      price: Number(price) || Math.round((Number(salePrice) || 0) * 1.45),
      description: (description || '').trim(),
      features: parsedFeatures,
      colors: parsedColors,
      dimensions: (dimensions || '').trim(),
      status: 'IN_STOCK',
    };
    console.log('[MODI Export] Creating record:', JSON.stringify(recordBody).substring(0, 200));
    const record = await apiFetch('https://db.mkg.vn/api/collections/modi_products/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(recordBody),
    });
    console.log('[MODI Export] PB record result:', JSON.stringify(record).substring(0, 300));
    if (!record.id) return res.status(400).json({ error: 'Tạo record thất bại: ' + (record.message || record.data ? JSON.stringify(record.data || record) : JSON.stringify(record)) });

    // Step 3: Upload images
    const files = req.files || {};
    const allImages = [...(files.mainImage || []), ...(files.subImages || [])];
    if (allImages.length > 0) {
      const boundary = '----BananaUpload' + Date.now();
      const allParts = [];
      for (const file of allImages) {
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="${file.originalname || 'image.jpg'}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`;
        allParts.push(Buffer.from(header), file.buffer, Buffer.from('\r\n'));
      }
      allParts.push(Buffer.from(`--${boundary}--\r\n`));
      const bodyBuffer = Buffer.concat(allParts);

      console.log(`[MODI Export] Uploading ${allImages.length} images (${(bodyBuffer.length / 1024).toFixed(0)}KB total)...`);
      const uploadRes = await fetch(`https://db.mkg.vn/api/collections/modi_products/records/${record.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Authorization': token,
        },
        body: bodyBuffer,
      });
      // Safely parse response (may be non-JSON if upstream proxy returns 413 etc)
      const uploadText = await uploadRes.text();
      let uploadData;
      try {
        uploadData = JSON.parse(uploadText);
      } catch {
        console.error(`[MODI Export] Upload failed (${uploadRes.status}):`, uploadText.substring(0, 200));
        // Non-fatal: record was already created, just images failed
        uploadData = { warning: `Image upload failed (${uploadRes.status}): ${uploadText.substring(0, 100)}` };
      }
      console.log('[MODI Export] Upload result:', JSON.stringify(uploadData).substring(0, 200));
      if (!uploadData.id) console.warn('[MODI Export] Image upload warning:', JSON.stringify(uploadData));
    }

    res.json({ success: true, id: record.id, slug: record.slug || slug, name: record.name || name });
  } catch (err) {
    console.error('[MODI Export] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ────── PocketBase Image Storage ──────

let _pbTokenCache = {};

/** Helper: authenticate PocketBase and return token */
async function pbAuth(email, password) {
  let finalEmail = (email && email.trim()) ? email : null;
  let finalPassword = (password && password.trim()) ? password : null;

  if (!finalEmail || !finalPassword) {
    const activeConfig = await getDynamicConfig();
    finalEmail = activeConfig.pbEmail;
    finalPassword = activeConfig.pbPassword;
  }

  if (!finalEmail || !finalPassword) throw new Error('Missing PocketBase credentials');

  const cacheKey = finalEmail.trim();
  const cached = _pbTokenCache[cacheKey];
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const data = await apiFetch('https://db.mkg.vn/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: finalEmail.trim(), password: finalPassword.trim() }),
  });
  if (!data.token) throw new Error('PocketBase auth failed: ' + JSON.stringify(data));
  
  // Cache for 10 days (PB tokens usually last 14 days)
  _pbTokenCache[cacheKey] = {
    token: data.token,
    expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000
  };
  
  return data.token;
}

// ────── Gateway Config API ──────
app.get('/api/gateway-config', async (req, res) => {
  try {
    const { pbEmail, pbPassword } = req.query;
    const token = await pbAuth(pbEmail, pbPassword);

    const url = `https://db.mkg.vn/api/collections/banana_sync/records?filter=key="gateway_config"`;
    const searchRes = await apiFetch(url, {
      headers: { 'Authorization': token },
    });
    const record = searchRes.items?.[0];
    const data = record ? record.data : {};
    
    res.json({
      success: true,
      config: {
        googleProjectId: data.googleProjectId || CONFIG.projectId,
        googleAuth: data.googleAuth || CONFIG.authorization,
        maxStudioKey: data.maxStudioKey || CONFIG.apiKey,
        openrouterKey: data.openrouterKey || CONFIG.openrouterKey,
        pbEmail: data.pbEmail || CONFIG.pbEmail,
        pbPassword: data.pbPassword || CONFIG.pbPassword,
      }
    });
  } catch (err) {
    console.error('get gateway-config error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gateway-config', async (req, res) => {
  try {
    const { pbEmail, pbPassword, config: newConfig } = req.body;
    const token = await pbAuth(pbEmail, pbPassword);

    const searchUrl = `https://db.mkg.vn/api/collections/banana_sync/records?filter=key="gateway_config"`;
    const searchRes = await apiFetch(searchUrl, {
      headers: { 'Authorization': token },
    });
    const existingRecord = searchRes.items?.[0];

    let result;
    if (existingRecord) {
      result = await apiFetch(`https://db.mkg.vn/api/collections/banana_sync/records/${existingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ key: 'gateway_config', data: newConfig }),
      });
    } else {
      result = await apiFetch(`https://db.mkg.vn/api/collections/banana_sync/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ key: 'gateway_config', data: newConfig }),
      });
    }

    _cachedDbConfig = null;
    _cachedDbConfigTime = 0;
    _dbAuthToken = null;
    _dbAuthTokenExpires = 0;

    res.json({ success: true, record: result });
  } catch (err) {
    console.error('save gateway-config error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/pb-create-collection — Auto-create banana_images collection */
app.post('/api/pb-create-collection', async (req, res) => {
  try {
    const { pbEmail, pbPassword } = req.body;
    const token = await pbAuth(pbEmail, pbPassword);

    // Check if collection exists
    try {
      await apiFetch('https://db.mkg.vn/api/collections/banana_images', {
        headers: { 'Authorization': token },
      });
      return res.json({ success: true, message: 'Collection already exists' });
    } catch {}

    // Create collection
    const collectionDef = {
      name: 'banana_images',
      type: 'base',
      fields: [
        { name: 'image', type: 'file', options: { maxSelect: 1, maxSize: 10485760, mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } },
        { name: 'prompt', type: 'text' },
        { name: 'model', type: 'text' },
        { name: 'ratio', type: 'text' },
        { name: 'folder_id', type: 'text' },
        { name: 'tags', type: 'json' },
        { name: 'source', type: 'text' },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    };

    const result = await apiFetch('https://db.mkg.vn/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(collectionDef),
    });
    res.json({ success: true, collection: result });
  } catch (err) {
    console.error('pb-create-collection error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/save-to-pb — Download image from URL and upload to PocketBase */
app.post('/api/save-to-pb', async (req, res) => {
  try {
    const { imageUrl, prompt, model, ratio, folder_id, tags, source, pbEmail, pbPassword } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });

    const token = await pbAuth(pbEmail, pbPassword);

    // Download the image
    console.log('[PB-IMG] Downloading:', imageUrl.substring(0, 80) + '...');
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error('Failed to download image: ' + imgResponse.status);
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const rand = Math.floor(Math.random() * 10000);
    const filename = `banana-${Date.now()}-${rand}.${ext}`;

    // Build multipart form data using Node native FormData
    const formData = new FormData();
    formData.append('image', new Blob([imgBuffer], { type: contentType }), filename);
    formData.append('prompt', prompt || '');
    formData.append('model', model || '');
    formData.append('ratio', ratio || '');
    formData.append('folder_id', folder_id || 'root');
    formData.append('source', source || 'generated');
    if (tags) {
      formData.append('tags', typeof tags === 'string' ? tags : JSON.stringify(tags));
    }

    const uploadRes = await fetch('https://db.mkg.vn/api/collections/banana_images/records', {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData,
    });
    const record = await uploadRes.json();
    console.log('[PB-IMG] Saved:', record.id);

    if (!record.id) return res.status(400).json({ error: 'PB upload failed', details: record });

    // Return persistent URL
    const pbUrl = `https://db.mkg.vn/api/files/banana_images/${record.id}/${record.image}`;
    res.json({ success: true, id: record.id, imageUrl: pbUrl, record });
  } catch (err) {
    console.error('save-to-pb error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/pb-images — List images from PocketBase with filter */
app.get('/api/pb-images', async (req, res) => {
  try {
    const { pbEmail, pbPassword, folder_id, page, perPage, search } = req.query;

    const token = await pbAuth(pbEmail, pbPassword);
    const params = new URLSearchParams();
    params.set('page', page || '1');
    params.set('perPage', perPage || '50');
    params.set('sort', '-created');

    const filters = [];
    if (folder_id && folder_id !== 'all') filters.push(`folder_id="${folder_id}"`);
    if (search) filters.push(`prompt~"${search}"`);
    if (filters.length) params.set('filter', filters.join('&&'));

    const data = await apiFetch(`https://db.mkg.vn/api/collections/banana_images/records?${params.toString()}`, {
      headers: { 'Authorization': token },
    });

    // Add full URLs to each item
    const items = (data.items || []).map(item => ({
      ...item,
      imageUrl: item.image ? `https://db.mkg.vn/api/files/banana_images/${item.id}/${item.image}` : null,
      thumbUrl: item.image ? `https://db.mkg.vn/api/files/banana_images/${item.id}/${item.image}?thumb=300x300` : null,
    }));

    res.json({ ...data, items });
  } catch (err) {
    console.error('pb-images list error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/pb-images/:id — Delete image from PocketBase */
app.delete('/api/pb-images/:id', async (req, res) => {
  try {
    const { pbEmail, pbPassword } = req.query;

    const token = await pbAuth(pbEmail, pbPassword);
    await fetch(`https://db.mkg.vn/api/collections/banana_images/records/${req.params.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('pb-images delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/pb-images/:id — Update image metadata (e.g. move to folder) */
app.patch('/api/pb-images/:id', async (req, res) => {
  try {
    const { pbEmail, pbPassword, ...updateData } = req.body;

    const token = await pbAuth(pbEmail, pbPassword);
    const result = await apiFetch(`https://db.mkg.vn/api/collections/banana_images/records/${req.params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(updateData),
    });
    res.json({ success: true, record: result });
  } catch (err) {
    console.error('pb-images update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── settings sync: Load keyed settings ──────
app.get('/api/pb-load', async (req, res) => {
  try {
    const { key, pbEmail, pbPassword } = req.query;
    if (!key) return res.status(400).json({ error: 'Missing key' });

    const token = await pbAuth(pbEmail, pbPassword);

    const url = `https://db.mkg.vn/api/collections/banana_sync/records?filter=key="${encodeURIComponent(key)}"`;
    const searchRes = await apiFetch(url, {
      headers: { 'Authorization': token },
    });

    const record = searchRes.items?.[0];
    if (record) {
      res.json({ success: true, data: record.data });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (err) {
    console.error('pb-load error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── settings sync: Save/Upsert keyed settings ──────
app.post('/api/pb-save', async (req, res) => {
  try {
    const { key, data, pbEmail, pbPassword } = req.body;
    if (!key) return res.status(400).json({ error: 'Missing key' });

    const token = await pbAuth(pbEmail, pbPassword);

    // Auto-create banana_sync collection if not exists
    const searchUrl = `https://db.mkg.vn/api/collections/banana_sync/records?filter=key="${encodeURIComponent(key)}"`;
    let searchRes;
    try {
      searchRes = await apiFetch(searchUrl, {
        headers: { 'Authorization': token },
      });
    } catch (err) {
      console.log('banana_sync query failed, attempting to create collection...');
      try {
        const collectionDef = {
          name: 'banana_sync',
          type: 'base',
          fields: [
            { name: 'key', type: 'text', required: true },
            { name: 'data', type: 'json' },
          ],
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: '',
        };
        await apiFetch('https://db.mkg.vn/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': token },
          body: JSON.stringify(collectionDef),
        });
        searchRes = await apiFetch(searchUrl, {
          headers: { 'Authorization': token },
        });
      } catch (createErr) {
        throw new Error('Failed to query/create banana_sync collection: ' + createErr.message);
      }
    }

    const existingRecord = searchRes?.items?.[0];
    let result;
    if (existingRecord) {
      result = await apiFetch(`https://db.mkg.vn/api/collections/banana_sync/records/${existingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ key, data }),
      });
    } else {
      result = await apiFetch(`https://db.mkg.vn/api/collections/banana_sync/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ key, data }),
      });
    }

    res.json({ success: true, record: result });
  } catch (err) {
    console.error('pb-save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────── Start ──────
app.listen(PORT, () => {
  console.log(`\n🍌 Auto Google Banana — http://localhost:${PORT}\n`);
});

