import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('image');
    const projectId = formData.get('projectId');
    const authorization = formData.get('authorization');
    if (!file) return err('No image file provided', 400);
    const base64 = await fileToBase64(file);
    const data = await apiFetch('https://aisandbox-pa.googleapis.com/v1/flow/uploadImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authorization}` },
      body: JSON.stringify({
        clientContext: { projectId, tool: 'PINHOLE' },
        imageBytes: base64, isUserUploaded: true, isHidden: false,
        mimeType: file.type, fileName: file.name,
      }),
    });
    return json(data);
  } catch (e) { return err(e.message); }
}
