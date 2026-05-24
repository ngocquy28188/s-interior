import { json, err, fileToBase64, getFullGatewayConfig } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('image');
    if (!file) return err('No image file provided', 400);

    // Load config: client override → PocketBase gateway_config
    const cfg = await getFullGatewayConfig({
      projectId:     formData.get('projectId'),
      authorization: formData.get('authorization'),
    });

    if (!cfg.authorization) return err('Google Authorization token chưa được cấu hình trong Gateway.', 401);
    if (!cfg.projectId)     return err('Google Project ID chưa được cấu hình trong Gateway.', 401);

    const base64 = await fileToBase64(file);
    const res = await fetch('https://aisandbox-pa.googleapis.com/v1/flow/uploadImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.authorization}`,
      },
      body: JSON.stringify({
        clientContext: { projectId: cfg.projectId, tool: 'PINHOLE' },
        imageBytes: base64,
        isUserUploaded: true,
        isHidden: false,
        mimeType: file.type,
        fileName: file.name,
      }),
    });

    const data = await res.json();

    // Nếu Google trả về lỗi object, stringify rõ ràng
    if (data.error) {
      const msg = typeof data.error === 'object'
        ? (data.error.message || JSON.stringify(data.error))
        : data.error;
      return err(`Google API: ${msg}`, res.status || 500);
    }

    return json(data);
  } catch (e) {
    return err(e.message);
  }
}
