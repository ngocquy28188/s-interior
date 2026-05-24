import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const openrouterKey = (formData.get('openrouterKey') || context.env.OPENROUTER_API_KEY || '').trim();
    const curtainType = formData.get('curtainType') || '';
    const curtainColor = formData.get('curtainColor') || '';
    const installStyle = formData.get('installStyle') || '';
    const file = formData.get('image');

    if (!openrouterKey) return err('Missing OpenRouter API key', 400);
    if (!file) return err('Missing image file', 400);

    const base64 = await fileToBase64(file);
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
      { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
      { type: 'text', text: systemText },
    ];

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Curtains AI Prompt Gen',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content }],
        max_tokens: 1000,
        temperature: 0.5,
      }),
    });

    if (data.error) return err(data.error.message || JSON.stringify(data.error), 400);

    let reply = data.choices?.[0]?.message?.content || '{}';
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    try {
      return json(JSON.parse(jsonMatch ? jsonMatch[0] : reply));
    } catch {
      return err('Failed to parse JSON reply from AI model', 500);
    }
  } catch (e) {
    return err(e.message);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
