import crypto from 'node:crypto';

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

// Generar token de sesión aleatorio
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Handler para LOGIN
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const isValidUsername = username === adminUsername;
    const isValidPassword = password === adminPassword;

    if (!isValidUsername || !isValidPassword) {
      console.warn('[auth] Intento de login fallido:', {
        username,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        ok: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log('[auth] Login exitoso:', {
      username,
      timestamp: new Date().toISOString()
    });

    const cookieOptions = [
      `adminSession=${sessionToken}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${24 * 60 * 60}`,
      process.env.NODE_ENV === 'production' ? 'Secure' : ''
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('[auth] Error en login:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

// Handler para VERIFY
async function handleVerify(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies.adminSession;

    if (!sessionToken) {
      return res.status(401).json({
        authenticated: false,
        error: 'No session found'
      });
    }

    if (!/^[a-f0-9]{64}$/i.test(sessionToken)) {
      return res.status(401).json({
        authenticated: false,
        error: 'Invalid session token'
      });
    }

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

// Handler para LOGOUT
async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const cookieOptions = [
      'adminSession=',
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=0',
      process.env.NODE_ENV === 'production' ? 'Secure' : ''
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    console.log('[auth] Logout exitoso');

    return res.status(200).json({
      ok: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('[auth] Error en logout:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

// Handler principal que enruta según la URL
export default async function handler(req, res) {
  // Extraer la ruta del parámetro o de la URL
  const path = req.query.path || req.url?.split('/api/auth/')[1] || '';

  switch (path) {
    case 'login':
      return handleLogin(req, res);
    case 'verify':
      return handleVerify(req, res);
    case 'logout':
      return handleLogout(req, res);
    default:
      return res.status(404).json({
        ok: false,
        error: 'Auth endpoint not found'
      });
  }
}
