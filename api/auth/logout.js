export default async function handler(req, res) {
  // Permitir POST para logout
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Eliminar cookie de sesión
    const cookieOptions = [
      'adminSession=',
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=0', // Expira inmediatamente
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
