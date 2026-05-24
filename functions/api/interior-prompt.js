import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const openrouterKey = (formData.get('openrouterKey') || context.env.OPENROUTER_API_KEY || '').trim();
    const roomType = formData.get('roomType') || '';
    const colorPalette = formData.get('colorPalette') || '';
    const designStyle = formData.get('designStyle') || '';
    const subject = formData.get('subject') || '';
    const time = formData.get('time') || '';
    const file = formData.get('image');

    if (!openrouterKey) return err('Missing OpenRouter API key', 400);
    if (!file) return err('Missing image file', 400);

    const base64 = await fileToBase64(file);
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
      { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
      { type: 'text', text: systemText },
    ];

    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://img.mkg.vn',
        'X-Title': 'Interior AI Prompt Gen',
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
