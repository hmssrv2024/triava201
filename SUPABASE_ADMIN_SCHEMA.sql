-- =====================================================
-- SCRIPT SQL COMPLETO PARA SISTEMA DE ADMINISTRACIÓN
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. AGREGAR CAMPOS A TABLA EXISTENTE: registrations
-- =====================================================

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS account_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_by TEXT,
ADD COLUMN IF NOT EXISTS validation_amount NUMERIC DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMPTZ;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_registrations_account_blocked ON registrations(account_blocked);
CREATE INDEX IF NOT EXISTS idx_registrations_account_status ON registrations(account_status);

-- =====================================================
-- 2. TABLA: notifications (Notificaciones para usuarios)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES registrations(email) ON DELETE CASCADE,

  -- Contenido de la notificación
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error, transfer, reminder
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent

  -- Datos adicionales (JSON flexible)
  data JSONB,

  -- Acciones
  action_url TEXT,
  action_label TEXT,

  -- Estado
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Overlay/Modal
  show_as_overlay BOOLEAN DEFAULT false,
  auto_dismiss_seconds INTEGER,

  -- Metadata
  created_by TEXT DEFAULT 'system', -- 'system', 'admin', email del admin
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- 3. TABLA: pending_transfers (Transferencias pendientes)
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario receptor
  user_email TEXT NOT NULL REFERENCES registrations(email) ON DELETE CASCADE,

  -- Detalles de la transferencia
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  description TEXT,

  -- Estado
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, expired, cancelled

  -- Respuesta del usuario
  user_response TEXT,
  responded_at TIMESTAMPTZ,

  -- Metadata admin
  created_by TEXT NOT NULL, -- email del admin que creó la transferencia
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),

  -- Referencia a transacción final (si se acepta)
  transaction_id UUID REFERENCES user_transactions(id)
);

-- Índices para transferencias
CREATE INDEX IF NOT EXISTS idx_pending_transfers_user_email ON pending_transfers(user_email);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_status ON pending_transfers(status);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_created_at ON pending_transfers(created_at DESC);

-- =====================================================
-- 4. TABLA: admin_activity_log (Log de acciones admin)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin que ejecutó la acción
  admin_email TEXT NOT NULL,

  -- Acción realizada
  action_type TEXT NOT NULL, -- block_user, unblock_user, send_transfer, send_notification, update_validation_amount, etc.
  target_user_email TEXT, -- Usuario afectado (si aplica)

  -- Detalles
  description TEXT,
  data JSONB, -- Datos adicionales sobre la acción

  -- IP y User Agent
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_admin_log_admin_email ON admin_activity_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_log_target_user ON admin_activity_log(target_user_email);
CREATE INDEX IF NOT EXISTS idx_admin_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_log_created_at ON admin_activity_log(created_at DESC);

-- =====================================================
-- 5. TABLA: admin_settings (Configuración global)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clave única del setting
  setting_key TEXT UNIQUE NOT NULL,

  -- Valor del setting (JSON flexible)
  setting_value JSONB NOT NULL,

  -- Descripción
  description TEXT,

  -- Metadata
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar settings por defecto
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES
  ('default_validation_amount', '5.00', 'Monto de validación por defecto para nuevos usuarios'),
  ('transfer_expiry_days', '7', 'Días hasta que expire una transferencia pendiente'),
  ('notification_retention_days', '30', 'Días que se mantienen las notificaciones leídas'),
  ('auto_block_failed_logins', '5', 'Intentos fallidos antes de bloquear cuenta automáticamente')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 6. FUNCIONES ÚTILES
-- =====================================================

-- Función para crear notificación y transferencia juntas
CREATE OR REPLACE FUNCTION create_transfer_with_notification(
  p_user_email TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_admin_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_transfer_id UUID;
BEGIN
  -- Crear transferencia pendiente
  INSERT INTO pending_transfers (user_email, amount, description, created_by)
  VALUES (p_user_email, p_amount, p_description, p_admin_email)
  RETURNING id INTO v_transfer_id;

  -- Crear notificación
  INSERT INTO notifications (
    user_email,
    title,
    message,
    type,
    priority,
    show_as_overlay,
    data,
    action_url,
    action_label,
    created_by
  )
  VALUES (
    p_user_email,
    'Nueva Transferencia Recibida',
    'Has recibido $' || p_amount::TEXT || ' USD. ' || COALESCE(p_description, ''),
    'transfer',
    'high',
    true,
    json_build_object('transfer_id', v_transfer_id, 'amount', p_amount),
    '/transfers',
    'Ver Transferencia',
    p_admin_email
  );

  RETURN v_transfer_id;
END;
$$;

-- Función para aceptar transferencia
CREATE OR REPLACE FUNCTION accept_transfer(p_transfer_id UUID, p_user_response TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_transfer RECORD;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Obtener transferencia
  SELECT * INTO v_transfer
  FROM pending_transfers
  WHERE id = p_transfer_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar que no haya expirado
  IF v_transfer.expires_at < now() THEN
    UPDATE pending_transfers
    SET status = 'expired'
    WHERE id = p_transfer_id;
    RETURN false;
  END IF;

  -- Obtener balance actual
  SELECT current_balance INTO v_current_balance
  FROM user_balances
  WHERE user_email = v_transfer.user_email;

  -- Calcular nuevo balance
  v_new_balance := COALESCE(v_current_balance, 0) + v_transfer.amount;

  -- Crear transacción
  INSERT INTO user_transactions (
    user_email,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    currency,
    description,
    status,
    reference_id,
    metadata
  )
  VALUES (
    v_transfer.user_email,
    'admin_transfer',
    v_transfer.amount,
    COALESCE(v_current_balance, 0),
    v_new_balance,
    v_transfer.currency,
    v_transfer.description,
    'completed',
    p_transfer_id::TEXT,
    json_build_object('created_by', v_transfer.created_by, 'accepted_at', now())
  )
  RETURNING id INTO v_transaction_id;

  -- Actualizar balance
  INSERT INTO user_balances (user_email, current_balance, available_balance, currency, last_transaction_time)
  VALUES (v_transfer.user_email, v_new_balance, v_new_balance, v_transfer.currency, now())
  ON CONFLICT (user_email)
  DO UPDATE SET
    current_balance = v_new_balance,
    available_balance = v_new_balance,
    last_transaction_time = now(),
    updated_at = now();

  -- Actualizar transferencia como aceptada
  UPDATE pending_transfers
  SET
    status = 'accepted',
    user_response = p_user_response,
    responded_at = now(),
    transaction_id = v_transaction_id
  WHERE id = p_transfer_id;

  -- Crear notificación de confirmación
  INSERT INTO notifications (
    user_email,
    title,
    message,
    type,
    priority,
    created_by
  )
  VALUES (
    v_transfer.user_email,
    'Transferencia Aceptada',
    '¡Has aceptado la transferencia de $' || v_transfer.amount::TEXT || ' USD! Tu nuevo saldo es $' || v_new_balance::TEXT,
    'success',
    'normal',
    'system'
  );

  RETURN true;
END;
$$;

-- Función para rechazar transferencia
CREATE OR REPLACE FUNCTION reject_transfer(p_transfer_id UUID, p_user_response TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE pending_transfers
  SET
    status = 'rejected',
    user_response = p_user_response,
    responded_at = now()
  WHERE id = p_transfer_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications (usuarios solo ven sus notificaciones)
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (true); -- Por ahora público, después filtrar por auth.uid()

CREATE POLICY "Anyone can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (true);

-- Políticas para pending_transfers
CREATE POLICY "Public access to pending_transfers"
  ON pending_transfers FOR ALL
  USING (true);

-- Políticas para admin_activity_log
CREATE POLICY "Public read access to admin_activity_log"
  ON admin_activity_log FOR SELECT
  USING (true);

CREATE POLICY "Public insert access to admin_activity_log"
  ON admin_activity_log FOR INSERT
  WITH CHECK (true);

-- Políticas para admin_settings
CREATE POLICY "Public access to admin_settings"
  ON admin_settings FOR ALL
  USING (true);

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a admin_settings
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar que todo se creó correctamente
SELECT
  'notifications' as table_name,
  COUNT(*) as row_count
FROM notifications
UNION ALL
SELECT 'pending_transfers', COUNT(*) FROM pending_transfers
UNION ALL
SELECT 'admin_activity_log', COUNT(*) FROM admin_activity_log
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;
