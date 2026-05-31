import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const openrouterKey = (formData.get('openrouterKey') || '').trim();
    const mode = formData.get('mode');
    const file = formData.get('image');
    if (!openrouterKey) return err('Missing OpenRouter API key', 400);

    // ── MODE: rewrite — update prompt to match uploaded product image ──
    if (mode === 'rewrite') {
      if (!file) return err('Missing image', 400);
      const base64 = await fileToBase64(file);
      const currentPrompt = formData.get('currentPrompt') || '';
      const content = [
        { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
        {
          type: 'text',
          text: `You are an AI prompt engineer.
Analyze this product image and identify: product name, material, color, key design features.

Current prompt (may be empty):
"""${currentPrompt || '(empty)'}"""

Task:
- If current prompt is empty or generic: write a new detailed product photography prompt based on what you see.
- If current prompt has structure/style: KEEP its photographic style, lighting, camera angle, background. Only REPLACE the product description with what you see in the image.
- Keep the prompt in English.
- Return ONLY valid JSON (no markdown): {"rewrittenPrompt": "...the full updated prompt..."}`,
        },
      ];

      const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://img.mkg.vn',
          'X-Title': 'Banana AI',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [{ role: 'user', content }],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (data.error) return err(data.error.message || JSON.stringify(data.error), 400);

      let reply = data.choices?.[0]?.message?.content || '';
      if (!reply) return json({ rewrittenPrompt: currentPrompt });

      // Strip markdown code fences if any
      reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      try {
        return json(JSON.parse(jsonMatch ? jsonMatch[0] : reply));
      } catch {
        return json({ rewrittenPrompt: currentPrompt });
      }
    }

    // ── MODE: default — Pro Pipeline step analysis ──
    const stepsRaw = formData.get('steps') || '[]';
    const parsedSteps = JSON.parse(stepsRaw);
    const content = [];

    if (file) {
      const base64 = await fileToBase64(file);
      content.push({ type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } });
    }

    const stepsList = parsedSteps.map((s, i) => `Step ${i + 1} "${s.name}": ${s.prompt || '(empty)'}`).join('\n');
    content.push({
      type: 'text',
      text: `You are an expert AI image generation prompt engineer.
1. Analyze the reference image to identify the specific PRODUCT (type, characteristics, materials, colors, design).
2. For each pipeline step, read the existing prompt.
3. REPLACE the old product description with the NEW product from the image.
4. KEEP exact structure, camera angle, lighting, background, and rendering style. ONLY swap product details.
5. Keep prompts in English.
6. Return ONLY valid JSON array, no markdown:

Pipeline steps:
${stepsList}

Return format: [{"name": "Step Name", "improvedPrompt": "detailed prompt here"}, ...]`,
    });

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Auto Google Banana',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (data.error) return err(data.error.message || JSON.stringify(data.error), 400);

    const reply = data.choices?.[0]?.message?.content || '';
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    try {
      return json({ steps: JSON.parse(jsonMatch ? jsonMatch[0] : reply) });
    } catch {
      return json({ steps: parsedSteps, raw: reply, warning: 'Could not parse AI response as JSON' });
    }
  } catch (e) {
    return err(e.message);
  }
}
