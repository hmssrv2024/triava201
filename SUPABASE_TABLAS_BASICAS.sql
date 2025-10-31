-- =====================================================
-- VERSIÓN SIMPLIFICADA - Solo crear tablas básicas
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. AGREGAR CAMPOS A registrations
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

-- 2. CREAR TABLA notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES registrations(email) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  show_as_overlay BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label TEXT,
  auto_dismiss_seconds INTEGER,
  data JSONB,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_notifications_user_email ON notifications(user_email);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- 3. CREAR TABLA pending_transfers
CREATE TABLE IF NOT EXISTS pending_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES registrations(email) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'pending',
  user_response TEXT,
  responded_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  transaction_id UUID REFERENCES user_transactions(id)
);

-- Índices
CREATE INDEX idx_pending_transfers_user_email ON pending_transfers(user_email);
CREATE INDEX idx_pending_transfers_status ON pending_transfers(status);

-- 4. CREAR TABLA admin_activity_log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_user_email TEXT,
  description TEXT,
  data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_admin_log_admin_email ON admin_activity_log(admin_email);
CREATE INDEX idx_admin_log_action_type ON admin_activity_log(action_type);

-- 5. CREAR TABLA admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar settings por defecto
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES
  ('default_validation_amount', '5.00', 'Monto de validación por defecto'),
  ('transfer_expiry_days', '7', 'Días hasta que expire una transferencia'),
  ('notification_retention_days', '30', 'Días que se mantienen las notificaciones'),
  ('auto_block_failed_logins', '5', 'Intentos fallidos antes de bloquear')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. HABILITAR RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (ajustar según necesites)
CREATE POLICY "Public access" ON notifications FOR ALL USING (true);
CREATE POLICY "Public access" ON pending_transfers FOR ALL USING (true);
CREATE POLICY "Public access" ON admin_activity_log FOR SELECT USING (true);
CREATE POLICY "Public insert" ON admin_activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public access" ON admin_settings FOR ALL USING (true);

-- Verificar que se crearon correctamente
SELECT
  'notifications' as tabla,
  COUNT(*) as registros
FROM notifications
UNION ALL
SELECT 'pending_transfers', COUNT(*) FROM pending_transfers
UNION ALL
SELECT 'admin_activity_log', COUNT(*) FROM admin_activity_log
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;
