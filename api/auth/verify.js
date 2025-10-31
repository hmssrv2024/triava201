// Función para parsear cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=').trim();
    if (name) {
      cookies[name.trim()] = value;
    }
  });

  return cookies;
}

export default async function handler(req, res) {
  // Permitir GET para verificar sesión
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Obtener cookies
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies.adminSession;

    // Si no hay token, no está autenticado
    if (!sessionToken) {
      return res.status(401).json({
        authenticated: false,
        error: 'No session found'
      });
    }

    // Verificar que el token tenga formato válido (64 caracteres hex)
    if (!/^[a-f0-9]{64}$/i.test(sessionToken)) {
      return res.status(401).json({
        authenticated: false,
        error: 'Invalid session token'
      });
    }

    // Token válido, sesión activa
    return res.status(200).json({
      authenticated: true,
      message: 'Valid session'
    });

  } catch (error) {
    console.error('[auth] Error al verificar sesión:', error);
    return res.status(500).json({
      authenticated: false,
      error: 'Internal server error'
    });
  }
}
