-- =====================================================
-- SISTEMA DE AUTENTICACIÓN HÍBRIDA
-- Email/Password + Google OAuth + Validación Código 20 Dígitos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. MODIFICAR TABLA registrations
-- Agregar campos para autenticación si no existen
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email', -- 'email' o 'google'
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE, -- ID único de Google
ADD COLUMN IF NOT EXISTS google_avatar_url TEXT, -- URL de foto de perfil de Google
ADD COLUMN IF NOT EXISTS verification_code TEXT, -- Código de 20 dígitos
ADD COLUMN IF NOT EXISTS code_verified BOOLEAN DEFAULT false, -- Si el código fue verificado
ADD COLUMN IF NOT EXISTS code_verified_at TIMESTAMPTZ, -- Cuándo se verificó el código
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_device_info JSONB,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Crear índice para búsqueda rápida por email y password
CREATE INDEX IF NOT EXISTS idx_registrations_email_password ON registrations(email, password);

-- Crear índice para búsqueda por Google ID
CREATE INDEX IF NOT EXISTS idx_registrations_google_id ON registrations(google_id) WHERE google_id IS NOT NULL;

-- Crear índice para búsqueda por auth_provider
CREATE INDEX IF NOT EXISTS idx_registrations_auth_provider ON registrations(auth_provider);

-- 2. FUNCIÓN: Autenticar usuario con email/password (sistema actual)
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
  auth_provider TEXT,
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
    failed_login_attempts,
    registrations.auth_provider
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
      NULL::TEXT,
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
      NULL::TEXT,
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
        NULL::TEXT,
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
      NULL::TEXT,
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
    v_user.auth_provider,
    'Login exitoso'::TEXT;
END;
$$;

-- 3. FUNCIÓN: Verificar si usuario con Google existe
CREATE OR REPLACE FUNCTION check_google_user(
  p_google_id TEXT,
  p_email TEXT
)
RETURNS TABLE(
  exists BOOLEAN,
  user_id UUID,
  user_email TEXT,
  full_name TEXT,
  auth_provider TEXT,
  code_verified BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Buscar usuario por Google ID o email
  SELECT
    id,
    email,
    full_name,
    registrations.auth_provider,
    registrations.code_verified,
    account_blocked,
    block_reason
  INTO v_user
  FROM registrations
  WHERE google_id = p_google_id OR email = p_email
  LIMIT 1;

  -- Usuario no encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      false,
      'Usuario no existe, debe completar registro'::TEXT;
    RETURN;
  END IF;

  -- Cuenta bloqueada
  IF v_user.account_blocked THEN
    RETURN QUERY SELECT
      true,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      false,
      CONCAT('Cuenta bloqueada. Motivo: ', COALESCE(v_user.block_reason, 'No especificado'))::TEXT;
    RETURN;
  END IF;

  -- Usuario existe y está activo
  RETURN QUERY SELECT
    true,
    v_user.id,
    v_user.email,
    v_user.full_name,
    v_user.auth_provider,
    v_user.code_verified,
    'Usuario encontrado'::TEXT;
END;
$$;

-- 4. FUNCIÓN: Autenticar con Google (después de OAuth)
CREATE OR REPLACE FUNCTION authenticate_user_google(
  p_google_id TEXT,
  p_email TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  user_id UUID,
  user_email TEXT,
  full_name TEXT,
  account_blocked BOOLEAN,
  is_validated BOOLEAN,
  auth_provider TEXT,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Buscar usuario por Google ID o email
  SELECT
    id,
    email,
    full_name,
    account_blocked,
    block_reason,
    is_validated,
    registrations.auth_provider
  INTO v_user
  FROM registrations
  WHERE google_id = p_google_id OR email = p_email
  LIMIT 1;

  -- Usuario no encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      false,
      false,
      NULL::TEXT,
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
      NULL::TEXT,
      CONCAT('Cuenta bloqueada. Motivo: ', COALESCE(v_user.block_reason, 'No especificado'))::TEXT;
    RETURN;
  END IF;

  -- Login exitoso con Google
  -- Actualizar estadísticas
  UPDATE registrations
  SET
    last_login = now(),
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1
  WHERE email = v_user.email;

  RETURN QUERY SELECT
    true,
    v_user.id,
    v_user.email,
    v_user.full_name,
    false,
    v_user.is_validated,
    v_user.auth_provider,
    'Login exitoso con Google'::TEXT;
END;
$$;

-- 5. FUNCIÓN: Verificar código de 20 dígitos
CREATE OR REPLACE FUNCTION verify_code_20(
  p_email TEXT,
  p_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_stored_code TEXT;
BEGIN
  -- Obtener código almacenado
  SELECT verification_code INTO v_stored_code
  FROM registrations
  WHERE email = p_email;

  -- Usuario no encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'Usuario no encontrado'::TEXT;
    RETURN;
  END IF;

  -- Verificar código
  IF v_stored_code = p_code THEN
    -- Marcar como verificado
    UPDATE registrations
    SET
      code_verified = true,
      code_verified_at = now(),
      is_email_verified = true
    WHERE email = p_email;

    RETURN QUERY SELECT
      true,
      'Código verificado correctamente'::TEXT;
  ELSE
    RETURN QUERY SELECT
      false,
      'Código incorrecto'::TEXT;
  END IF;
END;
$$;

-- 6. FUNCIÓN: Obtener datos completos del usuario
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
          created_at,
          auth_provider,
          google_avatar_url,
          code_verified
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

-- 7. FUNCIÓN: Registrar actividad de dispositivo
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

-- 8. ÍNDICES ADICIONALES para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_balances_user_email ON user_balances(user_email);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_email_date ON user_transactions(user_email, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_email, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_pending_transfers_user_status ON pending_transfers(user_email, status) WHERE status = 'pending';

-- 9. TRIGGER: Crear balance automático al registrar usuario
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

-- 10. POLÍTICAS RLS actualizadas
-- Asegurar que user_balances tenga RLS habilitado
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios puedan leer su propio balance
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
CREATE POLICY "Users can view own balance"
  ON user_balances FOR SELECT
  USING (true); -- Por ahora público, después filtrar por auth

-- 11. VERIFICACIÓN
-- Probar función de autenticación email/password
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
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'pending_transfers', COUNT(*) FROM pending_transfers;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
