-- =====================================================
-- SISTEMA DE AUTENTICACIÓN Y SESIONES DE USUARIO
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. MODIFICAR TABLA registrations
-- Agregar campos para autenticación si no existen
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_device_info JSONB,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Crear índice para búsqueda rápida por email
CREATE INDEX IF NOT EXISTS idx_registrations_email_password ON registrations(email, password);

-- 2. FUNCIÓN: Autenticar usuario
CREATE OR REPLACE FUNCTION authenticate_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  user_id UUID,
  user_email TEXT,
  full_name TEXT,
  account_blocked BOOLEAN,
  is_validated BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Buscar usuario
  SELECT
    id,
    email,
    full_name,
    password,
    account_blocked,
    block_reason,
    is_validated,
    failed_login_attempts
  INTO v_user
  FROM registrations
  WHERE email = p_email;

  -- Usuario no encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      false,
      false,
      'Usuario no encontrado'::TEXT;
    RETURN;
  END IF;

  -- Cuenta bloqueada
  IF v_user.account_blocked THEN
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      true,
      false,
      CONCAT('Cuenta bloqueada. Motivo: ', COALESCE(v_user.block_reason, 'No especificado'))::TEXT;
    RETURN;
  END IF;

  -- Verificar contraseña
  IF v_user.password != p_password THEN
    -- Incrementar intentos fallidos
    UPDATE registrations
    SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
    WHERE email = p_email;

    -- Bloquear si supera 5 intentos
    IF COALESCE(v_user.failed_login_attempts, 0) >= 4 THEN
      UPDATE registrations
      SET
        account_blocked = true,
        block_reason = 'Demasiados intentos fallidos de login',
        blocked_at = now(),
        account_status = 'suspended'
      WHERE email = p_email;

      RETURN QUERY SELECT
        false,
        NULL::UUID,
        NULL::TEXT,
        NULL::TEXT,
        true,
        false,
        'Cuenta bloqueada por intentos fallidos'::TEXT;
      RETURN;
    END IF;

    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      false,
      false,
      'Contraseña incorrecta'::TEXT;
    RETURN;
  END IF;

  -- Login exitoso
  -- Actualizar estadísticas
  UPDATE registrations
  SET
    last_login = now(),
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1,
    failed_login_attempts = 0
  WHERE email = p_email;

  RETURN QUERY SELECT
    true,
    v_user.id,
    v_user.email,
    v_user.full_name,
    false,
    v_user.is_validated,
    'Login exitoso'::TEXT;
END;
$$;

-- 3. FUNCIÓN: Obtener datos completos del usuario
CREATE OR REPLACE FUNCTION get_user_data(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT row_to_json(r)
      FROM (
        SELECT
          id,
          email,
          full_name,
          first_name,
          last_name,
          preferred_name,
          nickname,
          country,
          state,
          phone_number,
          full_phone_number,
          document_type,
          document_number,
          account_status,
          is_validated,
          validation_amount,
          last_login,
          created_at
        FROM registrations
        WHERE email = p_email
      ) r
    ),
    'balance', (
      SELECT row_to_json(b)
      FROM (
        SELECT
          current_balance,
          available_balance,
          reserved_balance,
          currency,
          last_transaction_time
        FROM user_balances
        WHERE user_email = p_email
      ) b
    ),
    'recent_transactions', (
      SELECT json_agg(t)
      FROM (
        SELECT
          id,
          transaction_type,
          amount,
          currency,
          description,
          status,
          transaction_date
        FROM user_transactions
        WHERE user_email = p_email
        ORDER BY transaction_date DESC
        LIMIT 10
      ) t
    ),
    'unread_notifications', (
      SELECT json_agg(n)
      FROM (
        SELECT
          id,
          title,
          message,
          type,
          priority,
          show_as_overlay,
          created_at
        FROM notifications
        WHERE user_email = p_email
        AND is_read = false
        ORDER BY created_at DESC
        LIMIT 20
      ) n
    ),
    'pending_transfers', (
      SELECT json_agg(pt)
      FROM (
        SELECT
          id,
          amount,
          currency,
          description,
          status,
          created_at,
          expires_at
        FROM pending_transfers
        WHERE user_email = p_email
        AND status = 'pending'
        AND expires_at > now()
        ORDER BY created_at DESC
      ) pt
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. FUNCIÓN: Registrar actividad de dispositivo
CREATE OR REPLACE FUNCTION log_device_activity(
  p_email TEXT,
  p_device_info JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE registrations
  SET last_device_info = p_device_info
  WHERE email = p_email;
END;
$$;

-- 5. ÍNDICES ADICIONALES para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_balances_user_email ON user_balances(user_email);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_email_date ON user_transactions(user_email, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_email, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_pending_transfers_user_status ON pending_transfers(user_email, status) WHERE status = 'pending';

-- 6. TRIGGER: Crear balance automático al registrar usuario
CREATE OR REPLACE FUNCTION create_user_balance_on_register()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Crear balance inicial con $0
  INSERT INTO user_balances (user_email, current_balance, available_balance, reserved_balance, currency)
  VALUES (NEW.email, 0.00, 0.00, 0.00, 'USD')
  ON CONFLICT (user_email) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trg_create_user_balance ON registrations;
CREATE TRIGGER trg_create_user_balance
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_user_balance_on_register();

-- 7. POLÍTICAS RLS actualizadas
-- Asegurar que user_balances tenga RLS habilitado
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios puedan leer su propio balance
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
CREATE POLICY "Users can view own balance"
  ON user_balances FOR SELECT
  USING (true); -- Por ahora público, después filtrar por auth

-- 8. VERIFICACIÓN
-- Probar función de autenticación
SELECT * FROM authenticate_user('test@ejemplo.com', 'password123');

-- Verificar índices creados
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('registrations', 'user_balances', 'user_transactions', 'notifications', 'pending_transfers')
ORDER BY tablename, indexname;

-- Contar registros en tablas principales
SELECT
  'registrations' as tabla,
  COUNT(*) as registros
FROM registrations
UNION ALL
SELECT 'user_balances', COUNT(*) FROM user_balances
UNION ALL
SELECT 'user_transactions', COUNT(*) FROM user_transactions
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'pending_transfers', COUNT(*) FROM pending_transfers;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
