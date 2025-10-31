
# 🎯 Sistema de Administración Completo - REMEEX VISA

## ✅ ¿Qué Puedes Hacer Como Administrador?

Este sistema te permite gestionar completamente a tus usuarios desde el panel de administración:

### **1. Asignar Saldo** 💰
- Enviar dinero a usuarios
- Usuario recibe notificación tipo overlay
- Usuario puede **aceptar o rechazar** la transferencia
- Si acepta: saldo se actualiza automáticamente
- Si rechaza: transferencia se cancela

### **2. Bloquear/Desbloquear Cuentas** 🔒
- Bloquear acceso de cualquier usuario
- Especificar motivo del bloqueo
- Usuario ve overlay al intentar entrar
- Desbloquear cuando lo desees

### **3. Enviar Notificaciones** 🔔
- Notificaciones tipo overlay (modal bloqueante)
- Toast (notificaciones pequeñas en esquina)
- Prioridad: baja, normal, alta, urgente
- Tipos: info, success, warning, error, reminder

### **4. Modificar Monto de Validación** 📊
- Cambiar el monto mínimo requerido por usuario
- Default: $5.00 USD
- Configurable individualmente para cada usuario

### **5. Enviar Recordatorios** 📨
- Mensajes personalizados
- Aparecen como overlay en homevisa.html del usuario

### **6. Ver Logs de Actividad** 📝
- Historial de todas las acciones de admin
- Auditoría completa
- Filtros por admin, usuario, tipo de acción

---

## 📋 Paso 1: Configurar Base de Datos

### **Ejecutar SQL en Supabase**

1. Ve a: https://supabase.com/dashboard/project/ewdkxszfkqwlkyszodxu
2. Click en **SQL Editor**
3. Click en **New Query**
4. Copia y pega el contenido de: `SUPABASE_ADMIN_SCHEMA.sql`
5. Click en **Run** (▶️)

Esto creará:
- ✅ 4 nuevas tablas (notifications, pending_transfers, admin_activity_log, admin_settings)
- ✅ Nuevos campos en tabla `registrations`
- ✅ Funciones SQL automáticas
- ✅ Triggers y políticas de seguridad

**Verificación**:
```sql
-- Ejecuta esto para verificar
SELECT 'notifications' as tabla, COUNT(*) FROM notifications
UNION ALL
SELECT 'pending_transfers', COUNT(*) FROM pending_transfers
UNION ALL
SELECT 'admin_activity_log', COUNT(*) FROM admin_activity_log
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;
```

---

## 📦 Paso 2: Incluir Scripts en HTML

### **En homevisa.html (panel de usuario)**

Agrega antes de `</body>`:

```html
<!-- Supabase Integration -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client-frontend.js"></script>

<!-- Sistema de Notificaciones -->
<script src="js/user-notifications.js"></script>

<script>
  // Inicializar cuando el usuario esté logueado
  const userEmail = 'usuario@ejemplo.com'; // Obtener del sistema de login

  // Iniciar notificaciones
  const notifications = new UserNotificationSystem();
  notifications.init(userEmail);
</script>
```

### **En admin-usuarios.html (panel de administración - NUEVO)**

Crear archivo `public/admin-usuarios.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Administración - Gestión de Usuarios</title>
  <link rel="stylesheet" href="admin-usuarios.css">
</head>
<body>
  <div class="admin-container">
    <h1>🎯 Gestión de Usuarios</h1>

    <!-- Lista de usuarios -->
    <div id="users-list"></div>
  </div>

  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client-frontend.js"></script>
  <script src="js/admin-manager.js"></script>

  <script>
    // Inicializar gestor
    const adminEmail = 'admin@remeexvisa.com';
    const adminManager = new AdminManager();
    adminManager.init(adminEmail);

    // Cargar usuarios
    async function loadUsers() {
      const result = await adminManager.getAllUsers();
      if (result.ok) {
        displayUsers(result.data);
      }
    }

    function displayUsers(users) {
      const container = document.getElementById('users-list');
      container.innerHTML = users.map(user => `
        <div class="user-card">
          <h3>${user.full_name}</h3>
          <p>${user.email}</p>
          <p>Saldo: $${user.user_balances?.current_balance || 0}</p>

          <button onclick="sendMoney('${user.email}')">💰 Enviar Dinero</button>
          <button onclick="blockUser('${user.email}')">🔒 Bloquear</button>
          <button onclick="sendNotification('${user.email}')">🔔 Notificar</button>
        </div>
      `).join('');
    }

    // Funciones de acción
    async function sendMoney(email) {
      const amount = prompt('¿Cuánto dinero enviar?');
      const description = prompt('Descripción (opcional):');

      if (amount) {
        const result = await adminManager.sendBalanceToUser(email, parseFloat(amount), description);
        if (result.ok) {
          alert('✅ Transferencia enviada. El usuario puede aceptar o rechazar.');
        }
      }
    }

    async function blockUser(email) {
      const reason = prompt('Motivo del bloqueo:');
      if (reason) {
        const result = await adminManager.blockUser(email, reason);
        if (result.ok) {
          alert('✅ Usuario bloqueado');
          loadUsers();
        }
      }
    }

    async function sendNotification(email) {
      const title = prompt('Título de la notificación:');
      const message = prompt('Mensaje:');

      if (title && message) {
        const result = await adminManager.sendNotification(email, {
          title,
          message,
          type: 'info',
          priority: 'normal',
          showAsOverlay: true
        });

        if (result.ok) {
          alert('✅ Notificación enviada');
        }
      }
    }

    // Cargar al iniciar
    loadUsers();
  </script>
</body>
</html>
```

---

## 🚀 Paso 3: Uso del Sistema

### **Como Administrador**

#### **1. Enviar Dinero a Usuario**

```javascript
const adminManager = new AdminManager();
await adminManager.init('admin@remeexvisa.com');

// Enviar $100 a un usuario
const result = await adminManager.sendBalanceToUser(
  'usuario@ejemplo.com',
  100.00,
  'Bono de bienvenida'
);

console.log('Transferencia ID:', result.transferId);
```

**¿Qué pasa?**
1. Se crea transferencia pendiente en BD
2. Usuario recibe notificación overlay automáticamente
3. Usuario ve: "Has recibido $100 USD. Bono de bienvenida"
4. Usuario puede: ✅ Aceptar o ❌ Rechazar
5. Si acepta: saldo se actualiza, se crea transacción
6. Si rechaza: transferencia marcada como rechazada

#### **2. Bloquear Usuario**

```javascript
await adminManager.blockUser(
  'spammer@ejemplo.com',
  'Actividad sospechosa detectada'
);
```

**¿Qué pasa?**
1. Cuenta marcada como bloqueada
2. Usuario recibe notificación overlay
3. Al intentar usar homevisa.html, ve:
   - "⛔ Cuenta Bloqueada"
   - "Motivo: Actividad sospechosa detectada"
   - Botón: "Contactar Soporte"

#### **3. Desbloquear Usuario**

```javascript
await adminManager.unblockUser('spammer@ejemplo.com');
```

**¿Qué pasa?**
1. Cuenta marcada como activa
2. Usuario recibe notificación: "¡Tu cuenta ha sido reactivada!"

#### **4. Enviar Notificación**

```javascript
await adminManager.sendNotification('usuario@ejemplo.com', {
  title: 'Nuevas Funcionalidades',
  message: 'Hemos agregado nuevas opciones de transferencia. ¡Pruébalas!',
  type: 'info',
  priority: 'high',
  showAsOverlay: true,
  actionUrl: '/features',
  actionLabel: 'Ver Nuevas Funciones'
});
```

**Tipos disponibles**:
- `info` - Información (azul)
- `success` - Éxito (verde)
- `warning` - Advertencia (amarillo)
- `error` - Error (rojo)
- `transfer` - Transferencia (morado)
- `reminder` - Recordatorio (naranja)

**Prioridades**:
- `low` - Baja
- `normal` - Normal
- `high` - Alta
- `urgent` - Urgente

#### **5. Enviar Recordatorio**

```javascript
await adminManager.sendReminder(
  'usuario@ejemplo.com',
  'Recuerda validar tu cuenta para acceder a todas las funcionalidades'
);
```

#### **6. Modificar Monto de Validación**

```javascript
await adminManager.updateValidationAmount('usuario@ejemplo.com', 10.00);
```

**Default**: $5.00 USD por usuario

#### **7. Notificación Masiva**

```javascript
const emails = [
  'usuario1@ejemplo.com',
  'usuario2@ejemplo.com',
  'usuario3@ejemplo.com'
];

await adminManager.sendBulkNotification(emails, {
  title: 'Mantenimiento Programado',
  message: 'El sistema estará en mantenimiento mañana de 2-4 AM',
  type: 'warning',
  priority: 'high',
  showAsOverlay: true
});
```

#### **8. Ver Logs de Actividad**

```javascript
// Últimos 100 logs
const logs = await adminManager.getActivityLogs();

// Filtrar por admin
const logs = await adminManager.getActivityLogs({
  adminEmail: 'admin@remeexvisa.com',
  limit: 50
});

// Filtrar por usuario afectado
const logs = await adminManager.getActivityLogs({
  targetUser: 'usuario@ejemplo.com'
});

// Filtrar por tipo de acción
const logs = await adminManager.getActivityLogs({
  actionType: 'send_transfer'
});
```

**Tipos de acciones registradas**:
- `block_user` - Bloqueo de usuario
- `unblock_user` - Desbloqueo de usuario
- `send_transfer` - Envío de transferencia
- `cancel_transfer` - Cancelación de transferencia
- `send_notification` - Envío de notificación
- `update_validation_amount` - Actualización de monto de validación
- `update_setting` - Actualización de configuración

#### **9. Ver Transferencias Pendientes**

```javascript
// Todas las transferencias pendientes
const transfers = await adminManager.getPendingTransfers();

// De un usuario específico
const transfers = await adminManager.getPendingTransfers('usuario@ejemplo.com');
```

#### **10. Cancelar Transferencia**

```javascript
await adminManager.cancelTransfer('uuid-de-transferencia');
```

#### **11. Obtener Todos los Usuarios**

```javascript
// Todos los usuarios
const users = await adminManager.getAllUsers();

// Filtrar solo bloqueados
const blockedUsers = await adminManager.getAllUsers({ blocked: true });

// Filtrar por status
const activeUsers = await adminManager.getAllUsers({ status: 'active' });

// Buscar por nombre/email
const results = await adminManager.getAllUsers({ search: 'juan' });
```

---

### **Como Usuario (Lado del Cliente)**

El usuario NO necesita hacer nada manualmente. El sistema funciona automáticamente:

#### **Cuando el usuario entra a homevisa.html:**

```javascript
// Auto-inicialización (ya incluido en el código)
const userEmail = 'usuario@ejemplo.com'; // Del sistema de login

const notifications = new UserNotificationSystem();
await notifications.init(userEmail);
```

**El sistema automáticamente**:
1. ✅ Verifica si la cuenta está bloqueada → Muestra overlay bloqueante
2. ✅ Carga notificaciones no leídas → Muestra overlay/toast
3. ✅ Carga transferencias pendientes → Muestra overlay para aceptar/rechazar
4. ✅ Verifica estado de validación → Muestra aviso si no está validado
5. ✅ Inicia polling cada 10 segundos → Notificaciones en tiempo real

#### **Usuario ve overlay de transferencia:**

```
┌────────────────────────────────────┐
│                                    │
│            💰                      │
│                                    │
│   Nueva Transferencia              │
│                                    │
│   Has recibido $100 USD            │
│   Bono de bienvenida               │
│                                    │
│   [✅ Aceptar]  [❌ Rechazar]      │
│                                    │
└────────────────────────────────────┘
```

Click en **Aceptar**:
- Saldo actualizado
- Toast: "✅ ¡Transferencia aceptada! Tu saldo ha sido actualizado."
- Panel de saldo se refresca automáticamente

Click en **Rechazar**:
- Transferencia cancelada
- Toast: "Transferencia rechazada"

#### **Usuario ve cuenta bloqueada:**

```
┌────────────────────────────────────┐
│                                    │
│            ⛔                      │
│                                    │
│   Cuenta Bloqueada                 │
│                                    │
│   Tu cuenta ha sido suspendida.    │
│                                    │
│   Motivo: Actividad sospechosa     │
│   detectada                        │
│                                    │
│   [Contactar Soporte]              │
│                                    │
└────────────────────────────────────┘
```

**NO puede cerrar el overlay** - Solo puede contactar soporte

---

## 📊 Estructura de Base de Datos

### **Tabla: notifications**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| user_email | TEXT | Email del usuario receptor |
| title | TEXT | Título de la notificación |
| message | TEXT | Mensaje completo |
| type | TEXT | info, success, warning, error, transfer, reminder |
| priority | TEXT | low, normal, high, urgent |
| is_read | BOOLEAN | Si fue leída |
| show_as_overlay | BOOLEAN | Mostrar como overlay (modal) |
| action_url | TEXT | URL a donde redirigir |
| action_label | TEXT | Texto del botón de acción |
| created_by | TEXT | Email del admin que creó |
| created_at | TIMESTAMPTZ | Fecha de creación |

### **Tabla: pending_transfers**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| user_email | TEXT | Usuario receptor |
| amount | NUMERIC | Monto a transferir |
| currency | TEXT | Moneda (USD por defecto) |
| description | TEXT | Descripción |
| status | TEXT | pending, accepted, rejected, expired, cancelled |
| user_response | TEXT | Respuesta del usuario |
| responded_at | TIMESTAMPTZ | Cuándo respondió |
| created_by | TEXT | Admin que creó la transferencia |
| expires_at | TIMESTAMPTZ | Fecha de expiración (7 días por defecto) |
| transaction_id | UUID | ID de la transacción final (si se acepta) |

### **Tabla: admin_activity_log**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| admin_email | TEXT | Email del admin |
| action_type | TEXT | Tipo de acción |
| target_user_email | TEXT | Usuario afectado |
| description | TEXT | Descripción de la acción |
| data | JSONB | Datos adicionales |
| created_at | TIMESTAMPTZ | Timestamp |

### **Tabla: admin_settings**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| setting_key | TEXT | Clave única del setting |
| setting_value | JSONB | Valor (JSON flexible) |
| description | TEXT | Descripción |
| updated_by | TEXT | Último admin que actualizó |

### **Campos Nuevos en `registrations`**

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| account_blocked | BOOLEAN | false | Si cuenta está bloqueada |
| block_reason | TEXT | NULL | Motivo del bloqueo |
| blocked_at | TIMESTAMPTZ | NULL | Cuándo fue bloqueada |
| blocked_by | TEXT | NULL | Admin que bloqueó |
| validation_amount | NUMERIC | 5.00 | Monto de validación requerido |
| is_validated | BOOLEAN | false | Si cuenta está validada |
| validated_at | TIMESTAMPTZ | NULL | Cuándo se validó |
| admin_notes | TEXT | NULL | Notas del administrador |

---

## 🧪 Ejemplos Prácticos

### **Ejemplo 1: Promoción de Bienvenida**

```javascript
// Obtener usuarios nuevos (últimos 7 días)
const { data: newUsers } = await supabase
  .from('registrations')
  .select('email')
  .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString());

// Enviar $10 a cada uno
for (const user of newUsers) {
  await adminManager.sendBalanceToUser(
    user.email,
    10.00,
    '¡Bienvenido a REMEEX VISA! Aquí tienes $10 de regalo 🎁'
  );
}
```

### **Ejemplo 2: Recordatorio de Validación**

```javascript
// Obtener usuarios sin validar
const { data: unvalidated } = await supabase
  .from('registrations')
  .select('email, validation_amount')
  .eq('is_validated', false);

// Enviar recordatorio
for (const user of unvalidated) {
  await adminManager.sendReminder(
    user.email,
    `Recuerda validar tu cuenta con $${user.validation_amount} para acceder a todas las funcionalidades`
  );
}
```

### **Ejemplo 3: Bloqueo Masivo**

```javascript
// Bloquear múltiples cuentas sospechosas
const suspiciousEmails = ['spam1@example.com', 'spam2@example.com'];

for (const email of suspiciousEmails) {
  await adminManager.blockUser(email, 'Actividad sospechosa detectada');
}
```

### **Ejemplo 4: Dashboard de Admin**

```javascript
// Obtener estadísticas
const allUsers = await adminManager.getAllUsers();
const blockedUsers = await adminManager.getAllUsers({ blocked: true });
const pendingTransfers = await adminManager.getPendingTransfers();
const recentLogs = await adminManager.getActivityLogs({ limit: 10 });

console.log('Total usuarios:', allUsers.data.length);
console.log('Bloqueados:', blockedUsers.data.length);
console.log('Transferencias pendientes:', pendingTransfers.data.length);
console.log('Última actividad:', recentLogs.data[0]);
```

---

## ⚠️ Consideraciones Importantes

### **Seguridad**

1. **Autenticación Admin**: Actualmente usa localStorage. Para producción, implementa autenticación real con Supabase Auth.

2. **Validación de Permisos**: Las políticas RLS están abiertas. Debes configurarlas para que solo admins puedan escribir.

3. **Logs Inmutables**: Los logs de actividad no se pueden borrar (solo lectura para auditoría).

### **Límites**

- Transferencias expiran en 7 días (configurable)
- Notificaciones leídas se mantienen 30 días (configurable)
- Polling cada 10 segundos (configurable)

### **Rendimiento**

- Usa índices en BD para búsquedas rápidas
- Polling optimizado con timestamps
- Overlay no bloquea funcionalidad crítica

---

## 📝 Checklist de Implementación

- [ ] Ejecutar `SUPABASE_ADMIN_SCHEMA.sql` en Supabase
- [ ] Verificar que las 4 tablas se crearon
- [ ] Incluir scripts en homevisa.html
- [ ] Crear admin-usuarios.html (panel de gestión)
- [ ] Probar envío de transferencia
- [ ] Probar aceptar/rechazar transferencia
- [ ] Probar bloqueo de cuenta
- [ ] Probar envío de notificación
- [ ] Verificar logs de actividad
- [ ] Configurar polling interval (si es necesario)

---

## 🎉 Resultado Final

**Como Admin puedes**:
✅ Enviar dinero a usuarios (con aprobación)
✅ Bloquear/desbloquear cuentas
✅ Enviar notificaciones overlay/toast
✅ Modificar montos de validación
✅ Enviar recordatorios personalizados
✅ Ver logs completos de actividad
✅ Gestionar transferencias pendientes
✅ Configuración global del sistema

**El usuario verá**:
✅ Overlays de notificaciones automáticos
✅ Opciones para aceptar/rechazar transferencias
✅ Avisos de cuenta bloqueada
✅ Recordatorios personalizados
✅ Actualizaciones de saldo en tiempo real
✅ Sistema completamente automático (sin intervención manual)

**Todo en tiempo real, automático y sin backend adicional** 🚀
