import { json, err, cleanPrompt, getFullGatewayConfig } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { prompt, quantity, ratio, model, mediaId } = body;

    // Load config: client override → PocketBase gateway_config
    const cfg = await getFullGatewayConfig({
      projectId:     body.projectId,
      authorization: body.authorization,
      apiKey:        body.apiKey,
    });

    if (!cfg.apiKey)       return err('Max Studio API Key chưa được cấu hình trong Gateway.', 401);
    if (!cfg.authorization) return err('Google Authorization token chưa được cấu hình trong Gateway.', 401);

    const res = await fetch('https://max-studio.online/api/v1/create-task/image-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': cfg.apiKey,
      },
      body: JSON.stringify({
        prompt: cleanPrompt(prompt),
        quantity: Number(quantity) || 1,
        ratio,
        model,
        mediaId,
        projectId: cfg.projectId,
        seed: 10000,
        jwt: cfg.authorization,
      }),
    });

    const data = await res.json();

    // Fix error object display
    if (data.error) {
      const msg = typeof data.error === 'object'
        ? (data.error.message || JSON.stringify(data.error))
        : data.error;
      return err(`Max Studio: ${msg}`, res.status || 500);
    }

    return json(data);
  } catch (e) {
    return err(e.message);
  }
}
