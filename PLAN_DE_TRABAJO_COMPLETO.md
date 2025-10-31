# 📋 PLAN DE TRABAJO COMPLETO - REMEEX VISA
## Sistema Multi-Dispositivo + Administración

---

## ✅ ESTADO ACTUAL (Auditoría)

### **LO QUE YA ESTÁ FUNCIONANDO:**
✅ **Supabase configurado** con 8 tablas:
   - registrations (54 campos + 9 nuevos)
   - user_balances
   - user_transactions
   - user_sessions
   - notifications ← NUEVA
   - pending_transfers ← NUEVA
   - admin_activity_log ← NUEVA
   - admin_settings ← NUEVA

✅ **Scripts creados** (pero NO integrados):
   - `public/js/supabase-client-frontend.js`
   - `public/js/admin-manager.js`
   - `public/js/user-notifications.js`
   - `public/js/supabase-integration.js`

✅ **Frontend básico funcionando**:
   - `registro.html` → Guarda en Supabase ✅
   - `admin-login.html` → Login con localStorage ✅
   - `admin-registros.html` → Lee de Supabase ✅

❌ **LO QUE FALTA:**
   - homevisa.html NO tiene los scripts integrados
   - NO hay sistema de login de usuario
   - NO hay sincronización multi-dispositivo
   - Overlays NO aparecen (scripts no integrados)
   - victoria1.css NO modificado

---

## 🎯 REQUERIMIENTOS DEL CLIENTE

### **1. Mantener Almacenamiento Local**
- Datos guardados en localStorage como ahora
- Sin perder información al recargar
- Funciona offline

### **2. Login Multi-Dispositivo**
- Usuario ingresa email + contraseña
- Datos se sincronizan desde Supabase
- Puede usar en móvil, tablet, PC
- Sesión persistente

### **3. Sistema de Administración**
- Admin puede enviar dinero → Usuario acepta/rechaza
- Notificaciones tipo overlay
- Bloquear/desbloquear cuentas
- Todo en tiempo real

### **4. Limitaciones Vercel**
- Máximo 12 funciones serverless (actualmente: 5/12)
- Sin base de datos persistente propia
- Todo debe ser frontend + Supabase

---

## 🚀 PLAN DE IMPLEMENTACIÓN (4 FASES)

---

## **FASE 1: Sistema de Login de Usuario** 🔐
**Objetivo**: Permitir login desde cualquier dispositivo

### **Tareas**:

#### **1.1. Crear tabla `user_auth` en Supabase**
```sql
CREATE TABLE user_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL REFERENCES registrations(email),
  password_hash TEXT NOT NULL,
  pin_hash TEXT,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  devices JSONB DEFAULT '[]', -- Lista de dispositivos usados
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **1.2. Crear `login.html` (Login de Usuario)**
- Formulario: Email + Contraseña
- Validar contra Supabase
- Guardar sesión en localStorage + Supabase (user_sessions)
- Redirigir a homevisa.html

#### **1.3. Función de Login**
```javascript
async function loginUser(email, password) {
  // 1. Validar contra Supabase
  // 2. Crear sesión en user_sessions
  // 3. Guardar en localStorage
  // 4. Cargar datos de Supabase a localStorage
  // 5. Redirigir a homevisa.html
}
```

**Archivos a crear**:
- `public/login.html`
- `public/js/user-auth.js`

**Tiempo estimado**: 2 horas

---

## **FASE 2: Sincronización Multi-Dispositivo** 🔄
**Objetivo**: Datos disponibles en todos los dispositivos

### **Tareas**:

#### **2.1. Sistema de Sincronización**
```javascript
// Al hacer login:
async function syncFromSupabase(email) {
  // 1. Obtener balance de user_balances
  // 2. Obtener transacciones de user_transactions
  // 3. Obtener perfil de registrations
  // 4. Guardar todo en localStorage
  // 5. Actualizar UI
}

// Al hacer cambios:
async function syncToSupabase(data) {
  // 1. Guardar en localStorage (instantáneo)
  // 2. Enviar a Supabase (background)
  // 3. Si falla: reintentar después
}
```

#### **2.2. Verificación de Sesión**
```javascript
// En homevisa.html al cargar:
async function checkSession() {
  const session = localStorage.getItem('user_session');

  if (!session) {
    // No hay sesión → Redirigir a login.html
    window.location.href = '/login.html';
    return;
  }

  // Verificar si sesión es válida en Supabase
  const valid = await validateSession(session);

  if (!valid) {
    // Sesión expirada → Redirigir a login
    localStorage.clear();
    window.location.href = '/login.html';
  }

  // Sesión válida → Cargar datos
  await syncFromSupabase(session.email);
}
```

#### **2.3. Auto-Sync Periódico**
```javascript
// Sincronizar cada 30 segundos
setInterval(async () => {
  await syncFromSupabase(userEmail);
}, 30000);
```

**Archivos a modificar**:
- `public/homevisa.html` (agregar checkSession)
- `public/js/user-auth.js` (agregar sync functions)

**Tiempo estimado**: 3 horas

---

## **FASE 3: Integrar Sistema de Notificaciones** 🔔
**Objetivo**: Overlays y notificaciones funcionando en homevisa.html

### **Tareas**:

#### **3.1. Modificar homevisa.html**
Agregar ANTES de `</body>`:
```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client-frontend.js"></script>

<!-- Sistema de Notificaciones -->
<script src="js/user-notifications.js"></script>

<!-- Inicialización -->
<script>
  // Obtener email del usuario logueado
  const userEmail = localStorage.getItem('user_email');

  if (userEmail) {
    // Iniciar sistema de notificaciones
    const notificationSystem = new UserNotificationSystem();
    notificationSystem.init(userEmail);
  }
</script>
```

#### **3.2. Probar Overlays**
- Admin envía transferencia → Usuario ve overlay
- Admin bloquea cuenta → Usuario ve overlay
- Admin envía notificación → Usuario ve overlay

**Archivos a modificar**:
- `public/homevisa.html`

**Tiempo estimado**: 1 hora

---

## **FASE 4: Panel de Administración** 👨‍💼
**Objetivo**: Panel completo para gestionar usuarios

### **Tareas**:

#### **4.1. Crear `admin-usuarios.html`**
Panel con:
- Lista de todos los usuarios
- Balance de cada uno
- Estado online/offline
- Botones:
  - 💰 Enviar Dinero
  - 🔒 Bloquear
  - 🔓 Desbloquear
  - 🔔 Enviar Notificación
  - 📊 Ver Historial
  - ⚙️ Configurar Validación

#### **4.2. Funciones de Admin**
```javascript
// Enviar dinero
async function sendMoney(userEmail) {
  const amount = prompt('¿Cuánto enviar?');
  const description = prompt('Descripción:');

  const result = await adminManager.sendBalanceToUser(
    userEmail,
    parseFloat(amount),
    description
  );

  if (result.ok) {
    alert('✅ Transferencia enviada. Usuario puede aceptar/rechazar.');
  }
}

// Bloquear usuario
async function blockUser(userEmail) {
  const reason = prompt('Motivo del bloqueo:');

  const result = await adminManager.blockUser(userEmail, reason);

  if (result.ok) {
    alert('✅ Usuario bloqueado');
    loadUsers(); // Recargar lista
  }
}

// Enviar notificación
async function notify(userEmail) {
  const title = prompt('Título:');
  const message = prompt('Mensaje:');

  await adminManager.sendNotification(userEmail, {
    title,
    message,
    type: 'info',
    showAsOverlay: true
  });

  alert('✅ Notificación enviada');
}
```

**Archivos a crear**:
- `public/admin-usuarios.html`
- `public/css/admin-usuarios.css`

**Tiempo estimado**: 4 horas

---

## 📊 ARQUITECTURA FINAL

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Dispositivo 1 (PC)          Dispositivo 2 (Móvil) │
│  ┌──────────────┐            ┌──────────────┐      │
│  │ homevisa.html│            │ homevisa.html│      │
│  │              │            │              │      │
│  │ localStorage │◄──────────►│ localStorage │      │
│  └──────┬───────┘            └──────┬───────┘      │
│         │                           │              │
│         └───────────┬───────────────┘              │
│                     │                              │
│                     ▼                              │
│         ┌─────────────────────┐                    │
│         │    SUPABASE DB      │                    │
│         │  (Sincronización)   │                    │
│         └─────────────────────┘                    │
│                     ▲                              │
│                     │                              │
└─────────────────────┼──────────────────────────────┘
                      │
┌─────────────────────┼──────────────────────────────┐
│                     │         ADMIN                │
├─────────────────────┼──────────────────────────────┤
│                     │                              │
│         ┌───────────▼──────────┐                   │
│         │ admin-usuarios.html  │                   │
│         │                      │                   │
│         │ • Enviar dinero      │                   │
│         │ • Bloquear cuentas   │                   │
│         │ • Notificaciones     │                   │
│         │ • Ver logs           │                   │
│         └──────────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 FLUJO DE DATOS

### **Registro (registro.html)**
```
Usuario registra
    ↓
Guarda en:
1. Google Apps Script ✅ (actual)
2. Supabase (registrations) ✅ (nuevo)
3. localStorage ✅ (actual)
```

### **Login (login.html - NUEVO)**
```
Usuario ingresa email + contraseña
    ↓
Valida contra Supabase (user_auth)
    ↓
Si válido:
  1. Crea sesión en user_sessions
  2. Guarda sesión en localStorage
  3. Carga datos de Supabase → localStorage
  4. Redirige a homevisa.html
```

### **Usando App (homevisa.html)**
```
Usuario hace acción (ej: enviar dinero)
    ↓
1. Guarda en localStorage (instantáneo)
2. Envía a Supabase (background)
3. Si otro dispositivo:
   - Polling detecta cambio
   - Sincroniza localStorage
   - Actualiza UI
```

### **Admin envía dinero**
```
Admin en admin-usuarios.html
    ↓
Click "Enviar Dinero"
    ↓
1. Crea pending_transfer en Supabase
2. Crea notification para usuario
    ↓
Usuario en homevisa.html
    ↓
Polling detecta notification (10s)
    ↓
Muestra overlay: "💰 Nueva Transferencia"
    ↓
Usuario click "Aceptar"
    ↓
1. Ejecuta accept_transfer() en Supabase
2. Actualiza user_balances
3. Crea user_transactions
4. Sincroniza con localStorage
5. Muestra toast: "✅ Transferencia aceptada"
```

---

## 📦 ESTRUCTURA DE ARCHIVOS FINAL

```
public/
├── login.html ← NUEVO (login usuario)
├── homevisa.html ← MODIFICAR (agregar scripts)
├── registro.html ✅ (ya funciona)
├── admin-login.html ✅ (ya funciona)
├── admin-registros.html ✅ (ya funciona)
├── admin-usuarios.html ← NUEVO (panel gestión)
│
├── js/
│   ├── supabase-client-frontend.js ✅
│   ├── user-auth.js ← NUEVO
│   ├── user-notifications.js ✅
│   ├── admin-manager.js ✅
│   └── supabase-integration.js ✅
│
├── css/
│   ├── victoria1.css ✅ (ya existe)
│   └── admin-usuarios.css ← NUEVO
│
└── _backup_apis/ (no se sube a Vercel)
```

---

## 🚦 LIMITACIONES Y SOLUCIONES

### **Limitación 1: Vercel - 12 Funciones Serverless**
**Estado**: ✅ Solo usamos 5/12
**Solución**: Todo en frontend + Supabase, sin APIs adicionales

### **Limitación 2: Sin Backend Persistente**
**Estado**: ✅ Resuelto con Supabase
**Solución**: Supabase es nuestro backend

### **Limitación 3: Offline Support**
**Estado**: ✅ Con localStorage
**Solución**:
- localStorage para uso offline
- Sync a Supabase cuando hay conexión
- Queue de operaciones pendientes

### **Limitación 4: Seguridad de Contraseñas**
**Estado**: ⚠️ Por implementar
**Solución**:
- Hashear contraseñas con bcrypt.js (frontend)
- Nunca guardar contraseñas en texto plano
- Usar Supabase Auth (opcional)

---

## ⏱️ TIEMPO ESTIMADO TOTAL

| Fase | Tiempo | Prioridad |
|------|--------|-----------|
| Fase 1: Login Usuario | 2h | 🔴 ALTA |
| Fase 2: Multi-Dispositivo | 3h | 🔴 ALTA |
| Fase 3: Notificaciones | 1h | 🟡 MEDIA |
| Fase 4: Panel Admin | 4h | 🟢 BAJA |
| **TOTAL** | **10h** | |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Antes de empezar:**
- [x] Tablas creadas en Supabase
- [x] Scripts JS creados
- [ ] Usuario acepta plan de trabajo

### **Fase 1 (Login):**
- [ ] Crear tabla user_auth
- [ ] Crear login.html
- [ ] Crear user-auth.js
- [ ] Probar login básico

### **Fase 2 (Sync):**
- [ ] Implementar syncFromSupabase()
- [ ] Implementar syncToSupabase()
- [ ] Agregar checkSession() en homevisa.html
- [ ] Probar en 2 dispositivos diferentes

### **Fase 3 (Notificaciones):**
- [ ] Integrar scripts en homevisa.html
- [ ] Probar overlay de transferencia
- [ ] Probar overlay de bloqueo
- [ ] Probar notificaciones normales

### **Fase 4 (Admin):**
- [ ] Crear admin-usuarios.html
- [ ] Implementar lista de usuarios
- [ ] Implementar acciones (enviar, bloquear, notificar)
- [ ] Probar sistema completo

---

## 🎯 PRIORIDADES SUGERIDAS

### **AHORA (Urgente)**
1. ✅ Crear Pull Request y mergear cambios actuales
2. ✅ Deploy a producción
3. 🔴 **Fase 1: Sistema de Login** (2h)
4. 🔴 **Fase 2: Multi-Dispositivo** (3h)

### **DESPUÉS (Importante)**
5. 🟡 **Fase 3: Integrar Notificaciones** (1h)
6. 🟡 Probar sistema completo

### **FUTURO (Opcional)**
7. 🟢 **Fase 4: Panel Admin Completo** (4h)
8. 🟢 Mejoras de UI/UX
9. 🟢 Optimizaciones de rendimiento

---

## 🚨 RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Contraseñas sin hashear | Alta | Crítico | Implementar bcrypt.js |
| Conflictos de sincronización | Media | Alto | Timestamps + conflict resolution |
| Sesiones no expiran | Baja | Medio | TTL de 24 horas |
| Polling consume muchos recursos | Baja | Bajo | Usar Supabase Realtime (opcional) |

---

## 💡 ALTERNATIVAS Y MEJORAS FUTURAS

### **Opción A: Supabase Auth (Más Seguro)**
En lugar de sistema custom, usar Supabase Auth:
- Login con email mágico
- OAuth (Google, Facebook)
- MFA (autenticación de 2 factores)

**Pros**: Más seguro, menos código
**Contras**: Más complejo, curva de aprendizaje

### **Opción B: Supabase Realtime (Mejor que Polling)**
En lugar de polling cada 10s, usar websockets:
- Notificaciones instantáneas
- Menos carga en servidor
- Experiencia más fluida

**Pros**: Tiempo real verdadero
**Contras**: Más complejo

### **Opción C: Progressive Web App (PWA)**
Convertir en PWA:
- Instalar como app
- Funciona offline
- Push notifications nativas

**Pros**: Experiencia nativa
**Contras**: Más trabajo

---

## 📞 SIGUIENTE PASO

**¿Quieres que empiece con la Fase 1 (Sistema de Login)?**

Esto incluye:
1. Crear tabla `user_auth` en Supabase
2. Crear `login.html` para usuarios
3. Crear `user-auth.js` con funciones de login
4. Integrar en homevisa.html

Tiempo estimado: 2 horas

¿Procedo? 🚀
