import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const pbEmail = formData.get('pbEmail');
    const pbPassword = formData.get('pbPassword');
    const name = formData.get('name');
    const slug = formData.get('slug');
    const sku = formData.get('sku') || '';
    const salePrice = Number(formData.get('salePrice')) || 0;
    const price = Number(formData.get('price')) || Math.round(salePrice * 1.45);
    const category = formData.get('category') || 'COMBO';
    const material = formData.get('material') || 'MDF';
    const dimensions = formData.get('dimensions') || '';
    const description = formData.get('description') || '';
    const colorsRaw = formData.get('colors') || '[]';
    const featuresRaw = formData.get('features') || '[]';

    if (!pbEmail || !pbPassword) return err('Missing PocketBase credentials', 400);
    if (!name || !slug) return err('Missing name or slug', 400);

    let parsedColors = [], parsedFeatures = [];
    try { parsedColors = JSON.parse(colorsRaw); } catch { parsedColors = []; }
    try { parsedFeatures = JSON.parse(featuresRaw); } catch { parsedFeatures = []; }

    // Auth
    const authData = await apiFetch('https://db.mkg.vn/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: pbEmail.trim(), password: pbPassword.trim() }),
    });
    if (!authData.token) return err('PocketBase auth failed: ' + (authData.message || 'unknown'), 401);
    const token = authData.token;

    // Create product record
    const record = await apiFetch('https://db.mkg.vn/api/collections/modi_products/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim(), sku: sku.trim(), category, material, salePrice, price, description: description.trim(), features: parsedFeatures, colors: parsedColors, dimensions: dimensions.trim(), status: 'IN_STOCK' }),
    });
    if (!record.id) return err('Create record failed: ' + JSON.stringify(record), 400);

    // Upload images using multipart
    const mainImage = formData.get('mainImage');
    const subImages = formData.getAll('subImages');
    const allImages = [mainImage, ...subImages].filter(f => f instanceof File);

    if (allImages.length > 0) {
      const uploadFormData = new FormData();
      allImages.forEach(f => uploadFormData.append('images', f, f.name));
      await fetch(`https://db.mkg.vn/api/collections/modi_products/records/${record.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': token },
        body: uploadFormData,
      });
    }

    return json({ success: true, id: record.id, slug: record.slug || slug, name: record.name || name });
  } catch (e) { return err(e.message); }
}
