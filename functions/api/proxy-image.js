export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url).searchParams.get('url');
    if (!url) return new Response(JSON.stringify({ error: 'Missing url param' }), { status: 400 });
    const response = await fetch(url);
    const body = await response.arrayBuffer();
    return new Response(body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
