import crypto from 'node:crypto';

// Función para hashear contraseñas de forma segura
function hashPassword(password, salt = '') {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Generar token de sesión aleatorio
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validar que se envíen credenciales
    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Obtener credenciales de admin desde variables de entorno
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Verificar credenciales (comparación segura)
    const isValidUsername = username === adminUsername;
    const isValidPassword = password === adminPassword;

    if (!isValidUsername || !isValidPassword) {
      // Log de intento fallido (para seguridad)
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

    // Generar token de sesión
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Log de login exitoso
    console.log('[auth] Login exitoso:', {
      username,
      timestamp: new Date().toISOString()
    });

    // Configurar cookie de sesión (HTTP-only para seguridad)
    const cookieOptions = [
      `adminSession=${sessionToken}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${24 * 60 * 60}`, // 24 horas en segundos
      process.env.NODE_ENV === 'production' ? 'Secure' : '' // HTTPS solo en producción
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
