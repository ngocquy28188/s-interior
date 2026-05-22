import { json, err, fileToBase64, apiFetch } from './_lib.js';

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const openrouterKey = (formData.get('openrouterKey') || '').trim();
    const file = formData.get('image');
    if (!openrouterKey) return err('Missing OpenRouter API key', 400);
    if (!file) return err('Missing image file', 400);
    const base64 = await fileToBase64(file);
    const data = await apiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openrouterKey}`, 'HTTP-Referer': 'https://img.mkg.vn', 'X-Title': 'Banana AI' },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Bạn là chuyên gia SEO Content Nội thất. Phân tích hình ảnh, tạo thông tin tối ưu Google Search. CHỈ trả về JSON thuần, KHÔNG bọc markdown. Cấu trúc: {"name": "Tên SP chứa keyword SEO", "slug": "ten-sp-chua-keyword-khong-dau", "description": "150-300 chữ tối ưu SEO", "features": ["Tính năng 1", "Tính năng 2", "Tính năng 3"], "colors": ["Màu 1", "Màu 2"], "dimensions": "Rộng x Sâu x Cao mm"}' },
          { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
        ]}],
        max_tokens: 1500,
      }),
    });
    if (data.error) return err(data.error.message || JSON.stringify(data.error), 400);
    let raw = data.choices?.[0]?.message?.content || '';
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return json(JSON.parse(raw)); }
    catch { return err('AI không trả về JSON hợp lệ', 400); }
  } catch (e) { return err(e.message); }
}
