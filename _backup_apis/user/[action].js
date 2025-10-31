const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * API unificada para operaciones de usuario
 * Endpoints:
 * - GET /api/user/balance?email=xxx - Obtener saldo del usuario
 * - GET /api/user/transactions?email=xxx&limit=10 - Obtener historial de transacciones
 * - POST /api/user/session - Crear/actualizar sesión (estado online)
 * - GET /api/user/session?email=xxx - Obtener sesión actual
 * - POST /api/user/logout - Cerrar sesión (marcar offline)
 * - GET /api/user/profile?email=xxx - Obtener perfil completo del usuario
 */
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'balance':
        return await handleGetBalance(req, res);

      case 'transactions':
        return await handleGetTransactions(req, res);

      case 'session':
        if (req.method === 'POST') {
          return await handleCreateSession(req, res);
        } else if (req.method === 'GET') {
          return await handleGetSession(req, res);
        }
        break;

      case 'logout':
        return await handleLogout(req, res);

      case 'profile':
        return await handleGetProfile(req, res);

      default:
        return res.status(404).json({
          ok: false,
          error: 'Acción no encontrada',
          action: action
        });
    }
  } catch (error) {
    console.error('Error en API de usuario:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

/**
 * GET /api/user/balance?email=xxx
 * Obtener saldo del usuario
 */
async function handleGetBalance(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email requerido'
    });
  }

  try {
    // Intentar obtener balance existente
    let { data: balance, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_email', email)
      .single();

    // Si no existe, crear uno nuevo con saldo 0
    if (error && error.code === 'PGRST116') {
      const { data: newBalance, error: createError } = await supabase
        .from('user_balances')
        .insert({
          user_email: email,
          current_balance: 0.00,
          available_balance: 0.00,
          reserved_balance: 0.00,
          currency: 'USD'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      balance = newBalance;
    } else if (error) {
      throw error;
    }

    return res.status(200).json({
      ok: true,
      data: {
        email: balance.user_email,
        currentBalance: parseFloat(balance.current_balance),
        availableBalance: parseFloat(balance.available_balance),
        reservedBalance: parseFloat(balance.reserved_balance),
        currency: balance.currency,
        lastTransaction: balance.last_transaction_time,
        updatedAt: balance.updated_at
      }
    });
  } catch (error) {
    console.error('Error obteniendo balance:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener saldo',
      details: error.message
    });
  }
}

/**
 * GET /api/user/transactions?email=xxx&limit=10&offset=0
 * Obtener historial de transacciones del usuario
 */
async function handleGetTransactions(req, res) {
  const { email, limit = 50, offset = 0, type } = req.query;

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email requerido'
    });
  }

  try {
    let query = supabase
      .from('user_transactions')
      .select('*')
      .eq('user_email', email)
      .order('transaction_date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filtrar por tipo si se especifica
    if (type) {
      query = query.eq('transaction_type', type);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear transacciones
    const formattedTransactions = (transactions || []).map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      amount: parseFloat(tx.amount),
      balanceBefore: parseFloat(tx.balance_before),
      balanceAfter: parseFloat(tx.balance_after),
      currency: tx.currency,
      description: tx.description,
      status: tx.status,
      referenceId: tx.reference_id,
      externalReference: tx.external_reference,
      metadata: tx.metadata,
      date: tx.transaction_date,
      createdAt: tx.created_at
    }));

    return res.status(200).json({
      ok: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: formattedTransactions.length
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener transacciones',
      details: error.message
    });
  }
}

/**
 * POST /api/user/session
 * Crear o actualizar sesión (marcar usuario como online)
 * Body: { email, sessionToken, ipAddress, userAgent }
 */
async function handleCreateSession(req, res) {
  const { email, sessionToken, ipAddress, userAgent } = req.body;

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email requerido'
    });
  }

  try {
    // Buscar sesión existente activa
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_email', email)
      .eq('is_online', true)
      .order('login_time', { ascending: false })
      .limit(1)
      .single();

    let session;

    if (existingSession) {
      // Actualizar sesión existente
      const { data: updatedSession, error } = await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          ip_address: ipAddress || existingSession.ip_address,
          user_agent: userAgent || existingSession.user_agent
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (error) throw error;
      session = updatedSession;
    } else {
      // Crear nueva sesión
      const token = sessionToken || generateSessionToken(email);

      const { data: newSession, error } = await supabase
        .from('user_sessions')
        .insert({
          user_email: email,
          session_token: token,
          is_online: true,
          login_time: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          ip_address: ipAddress || null,
          user_agent: userAgent || null
        })
        .select()
        .single();

      if (error) throw error;
      session = newSession;
    }

    return res.status(200).json({
      ok: true,
      data: {
        sessionId: session.id,
        sessionToken: session.session_token,
        isOnline: session.is_online,
        loginTime: session.login_time,
        lastActivity: session.last_activity
      }
    });
  } catch (error) {
    console.error('Error creando sesión:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al crear sesión',
      details: error.message
    });
  }
}

/**
 * GET /api/user/session?email=xxx
 * Obtener sesión actual del usuario
 */
async function handleGetSession(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email requerido'
    });
  }

  try {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_email', email)
      .eq('is_online', true)
      .order('login_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!session) {
      return res.status(200).json({
        ok: true,
        data: {
          isOnline: false,
          session: null
        }
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        isOnline: true,
        sessionId: session.id,
        loginTime: session.login_time,
        lastActivity: session.last_activity,
        ipAddress: session.ip_address
      }
    });
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener sesión',
      details: error.message
    });
  }
}

/**
 * POST /api/user/logout
 * Cerrar sesión (marcar usuario como offline)
 * Body: { email }
 */
async function handleLogout(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email requerido'
    });
  }

  try {
    // Actualizar todas las sesiones activas a offline
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_online: false,
        logout_time: new Date().toISOString()
      })
      .eq('user_email', email)
      .eq('is_online', true);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      ok: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al cerrar sesión',
      details: error.message
    });
  }
}

/**
 * GET /api/user/profile?email=xxx
 * Obtener perfil completo del usuario desde registrations
 */
async function handleGetProfile(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email requerido'
    });
  }

  try {
    const { data: profile, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          ok: false,
          error: 'Usuario no encontrado'
        });
      }
      throw error;
    }

    // Formatear respuesta (sin exponer datos sensibles innecesariamente)
    return res.status(200).json({
      ok: true,
      data: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        firstName: profile.first_name,
        lastName: profile.last_name,
        preferredName: profile.preferred_name,
        nickname: profile.nickname,
        country: profile.country,
        state: profile.state,
        phone: profile.full_phone_number,
        documentType: profile.document_type,
        documentNumber: profile.document_number,
        accountStatus: profile.account_status,
        isVerified: profile.is_verified,
        emailVerified: profile.email_verified,
        lastLogin: profile.last_login,
        createdAt: profile.created_at
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener perfil',
      details: error.message
    });
  }
}

/**
 * Generar token de sesión único
 */
function generateSessionToken(email) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const emailHash = Buffer.from(email).toString('base64').replace(/=/g, '');
  return `${emailHash}_${timestamp}_${random}`;
}
