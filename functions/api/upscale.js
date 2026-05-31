import { json, err, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const { resolution, ratio, mediaId, authorization, projectId, apiKey } = await context.request.json();
    const data = await apiFetch('https://max-studio.online/api/v1/create-task/upscale-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ resolution: resolution || '4K', ratio, media_id: mediaId, jwt: authorization, projectId }),
    });
    return json(data);
  } catch (e) { return err(e.message); }
}
