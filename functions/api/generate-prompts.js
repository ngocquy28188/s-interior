import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const openrouterKey = (formData.get('openrouterKey') || '').trim();
    const configRaw = formData.get('config') || '{}';
    const productDesc = formData.get('productDesc') || '';
    if (!openrouterKey) return err('Missing OpenRouter key', 400);
    const config = JSON.parse(configRaw);

    const angles = config.cameraAngles || ['45°'];
    const systemPrompt = `You are a professional interior design visualizer and AI rendering prompt architect.
Your task: Generate ${angles.length} distinct viewpoint image prompts for a ${config.roomType || 'living-room'}.

CONFIGURATION:
- Render Style: ${config.renderStyle || 'photorealistic'}
- Color Palette: ${config.colorPalette || 'warm-neutral'}
- Atmosphere: ${config.atmosphere || 'minimalist'}
- Room Type: ${config.roomType || 'living-room'}
- Room Size: ${config.roomSize || 'medium'}
- Ceiling Height: ${config.ceilingHeight || '2.7m'}
- Lighting: ${config.lightingMood || 'warm-daylight'}
- Light Direction: ${config.lightDirection || 'left-window'}
- Camera Lens: ${config.cameraLens || '35mm'}
- Camera Angles: ${angles.join(' | ')}
- Camera Height: ${config.cameraHeight || 'eye-level'}
${config.notes ? `- Notes: ${config.notes}` : ''}

If product images are provided, analyze them and recreate them faithfully (materials, colors, textures).
IMPORTANT: You MUST return valid JSON with this exact structure: {"scenes": [{"scene_number": 1, "view_title": "angle name", "image_prompt": "Complete self-contained prompt here"}]}`;

    const userContent = [];
    if (productDesc) userContent.push({ type: 'text', text: `Product description: ${productDesc}` });

    const files = formData.getAll('images');
    for (const f of files) {
      if (!(f instanceof File) && !(f instanceof Blob)) continue;
      const b64 = await fileToBase64(f);
      const mime = f.type || 'image/jpeg';
      userContent.push({ type: 'text', text: `[Product Image]` });
      userContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'high' } });
    }

    if (!userContent.length) {
      userContent.push({ type: 'text', text: 'No specific product — create a beautiful generic interior scene with the given configuration.' });
    }

    const hasImages = files.some(f => f instanceof File || f instanceof Blob);

    const body = {
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    };
    // json_object mode only works without images
    if (!hasImages) body.response_format = { type: 'json_object' };

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Banana AI Prompt Gen',
      },
      body: JSON.stringify(body),
    });

    // Handle OpenRouter errors
    if (data.error) return err(data.error.message || JSON.stringify(data.error), 400);

    const content = data.choices?.[0]?.message?.content;
    if (!content) return err('No response from GPT — data: ' + JSON.stringify(data).substring(0, 200), 500);

    // Extract JSON from content (may be wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    try {
      return json(JSON.parse(jsonMatch ? jsonMatch[0] : content));
    } catch {
      return err('Could not parse GPT response as JSON: ' + content.substring(0, 200), 500);
    }
  } catch (e) {
    return err(e.message);
  }
}
