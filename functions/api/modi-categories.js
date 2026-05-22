import { json, err, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const { pbEmail, pbPassword } = await context.request.json();
    if (!pbEmail || !pbPassword) return err('Missing credentials', 400);
    const authData = await apiFetch('https://db.mkg.vn/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: pbEmail.trim(), password: pbPassword.trim() }),
    });
    if (!authData.token) return err('Auth failed', 401);
    const schema = await apiFetch('https://db.mkg.vn/api/collections/modi_products', {
      headers: { 'Authorization': authData.token },
    });
    const fields = schema.fields || schema.schema || [];
    const catField = fields.find(f => f.name === 'category');
    const options = catField?.options?.values || catField?.values || [];
    return json({ options });
  } catch (e) { return err(e.message); }
}
