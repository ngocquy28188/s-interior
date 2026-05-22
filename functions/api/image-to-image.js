import { json, err, cleanPrompt, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const { prompt, quantity, ratio, model, mediaId, projectId, authorization, apiKey } = await context.request.json();
    const data = await apiFetch('https://max-studio.online/api/v1/create-task/image-to-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ prompt: cleanPrompt(prompt), quantity: Number(quantity), ratio, model, mediaId, projectId, seed: 10000, jwt: authorization }),
    });
    return json(data);
  } catch (e) { return err(e.message); }
}
