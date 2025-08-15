export const onRequest: PagesFunction = async (ctx) => {
  const { request, env } = ctx;
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'POST' } });
  }

  const passFromEnv = (env as any).PASS as string | undefined;
  if (!passFromEnv) {
    return new Response('Auth not configured', { status: 500 });
  }

  let input: { pass?: string } = {};
  try {
    input = await request.json();
  } catch {}

  const provided = input.pass || '';
  if (!safeEqual(provided, passFromEnv)) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}


