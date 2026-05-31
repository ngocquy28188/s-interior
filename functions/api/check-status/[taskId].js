import { json, err, apiFetch } from '../_lib.js';

export async function onRequestGet(context) {
  try {
    const apiKey = context.request.headers.get('X-API-Key');
    const taskId = context.params.taskId;
    const data = await apiFetch(`https://max-studio.online/api/v1/check-status/${taskId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    return json(data);
  } catch (e) { return err(e.message); }
}
