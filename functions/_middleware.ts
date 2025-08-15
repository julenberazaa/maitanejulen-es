export const onRequest: PagesFunction = async (ctx) => {
  const { request, env, next } = ctx;
  const url = new URL(request.url);

  // Rutas públicas opcionales (no requieren auth)
  const PUBLIC_PATHS = new Set<string>(['/robots.txt']);
  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  // Leer la contraseña del Secret de Cloudflare (Settings → Variables and Secrets)
  const passFromEnv = (env as any).PASS as string | undefined;
  if (!passFromEnv) {
    return new Response('Auth not configured', { status: 500 });
  }

  // Permitir "cerrar sesión" devolviendo un 401 intencionado
  if (url.pathname === '/logout') {
    return challenge();
  }

  // Esperamos header: Authorization: Basic base64(user:password)
  const auth = request.headers.get('Authorization');
  if (!auth) return challenge();
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) return challenge();

  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch {
    return challenge();
  }

  const sep = decoded.indexOf(':');
  if (sep < 0) return challenge();
  // user puede ser cualquiera (p.ej., "invitado"); solo comprobamos password
  const /* user */ _ = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  // Comparación tiempo-constante
  if (!safeEqual(pass, passFromEnv)) {
    return challenge();
  }

  // Autenticado → continuar y servir el sitio estático
  return next();

  function challenge(): Response {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
        'Cache-Control': 'no-store',
      },
    });
  }
};

// Comparación tiempo-constante (XOR) para strings
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}


