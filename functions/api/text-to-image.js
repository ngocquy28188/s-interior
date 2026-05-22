import { json, err, cleanPrompt, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const { prompt, ratio, quantity, model, projectId, authorization, apiKey } = await context.request.json();
    const data = await apiFetch('https://max-studio.online/api/v1/create-task/text-to-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ prompt: cleanPrompt(prompt), ratio, quantity: Number(quantity), model, jwt: authorization, seed: 10000, projectId }),
    });
    return json(data);
  } catch (e) { return err(e.message); }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
