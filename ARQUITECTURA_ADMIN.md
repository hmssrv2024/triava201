# 📐 Arquitectura del Sistema de Administración

## 🎯 Objetivo
Sistema backend modular para administración de usuarios sin afectar el frontend existente.

## ✅ Separación Frontend/Backend

### Frontend del Usuario (NO MODIFICADO)
```
index.html → registro.html → homevisa.html
```
Este flujo permanece **INTACTO** y funcional.

### Panel de Administrador (NUEVO - SEPARADO)
```
admin-registros.html (acceso directo solo para admin)
```
El panel admin es **completamente independiente** del flujo de usuarios.

---

## 📦 Arquitectura Modular

El sistema backend está dividido en **4 módulos independientes**:

### 1️⃣ `admin-utils.js` - Utilidades Reutilizables
**Propósito:** Funciones comunes que se usan en todo el sistema.

**Funcionalidades:**
- Formateo de fechas y monedas
- Validación de datos
- Manejo de modales y toasts
- Exportación a CSV
- Paginación y filtros
- Almacenamiento seguro en localStorage

**Ejemplo de uso:**
```javascript
AdminUtils.formatCurrency(100); // "$100.00"
AdminUtils.showToast('Operación exitosa');
AdminUtils.downloadCSV(data, 'usuarios.csv');
```

---

### 2️⃣ `admin-supabase.js` - Integración con Supabase
**Propósito:** Todas las operaciones con la base de datos Supabase.

**Funcionalidades:**
- ✅ CRUD completo de usuarios
- ✅ Gestión de transferencias
- ✅ Sistema de notificaciones
- ✅ Logs de actividad
- ✅ Estadísticas y reportes
- ✅ Búsqueda y filtros

**Ejemplo de uso:**
```javascript
await AdminSupabase.getUsers(); // Obtiene todos los usuarios
await AdminSupabase.updateUser(userId, { blocked: true });
await AdminSupabase.createLog({ action: 'delete', description: '...' });
```

**Backend:** Supabase (sin servidor tradicional)

---

### 3️⃣ `admin-backend.js` - Lógica de Backend
**Propósito:** Orquesta operaciones complejas usando AdminUtils y AdminSupabase.

**Funcionalidades:**
- Gestión de estado global
- Sincronización localStorage ↔ Supabase
- Operaciones de usuarios (bloquear, eliminar, enviar dinero)
- Sistema de notificaciones masivas
- Logs de actividad
- Cálculo de estadísticas

**Ejemplo de uso:**
```javascript
await AdminBackend.init(); // Inicializa y carga datos
await AdminBackend.toggleBlockUser(userId);
await AdminBackend.sendMoney(userId, 100, 3650, 'Bono');
const stats = AdminBackend.getStats();
```

---

### 4️⃣ `admin-registros.js` - Orquestador UI
**Propósito:** Conecta la interfaz de usuario con el backend.

**Funcionalidades:**
- Autenticación de administrador
- Renderizado de componentes
- Event listeners
- Navegación entre secciones
- Interacción con modales y forms

**Ejemplo de uso:**
```javascript
// Se ejecuta automáticamente al cargar el panel
// Usa AdminBackend para todas las operaciones
```

---

## 🔄 Flujo de Datos

```
Usuario Admin → admin-registros.html
                     ↓
         admin-registros.js (UI)
                     ↓
         admin-backend.js (Lógica)
                ↙         ↘
   admin-utils.js    admin-supabase.js
                          ↓
                    Supabase DB
```

---

## 📁 Estructura de Archivos

```
public/
├── admin-registros.html    # Panel principal (HTML)
├── admin-registros.css     # Estilos del panel
├── admin-utils.js          # Módulo: Utilidades
├── admin-supabase.js       # Módulo: Integración Supabase
├── admin-backend.js        # Módulo: Lógica backend
└── admin-registros.js      # Módulo: Orquestador UI
```

---

## 🔐 Credenciales de Acceso

**Usuario:** `admin`
**Contraseña:** `admin123`

---

## ✨ Funcionalidades del Panel

### 📊 Dashboard
- Estadísticas en tiempo real
- Gráficos y métricas
- Actividad reciente

### 👥 Gestión de Usuarios
- Tabla completa con búsqueda y filtros
- Ver detalles de cada usuario
- Bloquear/desbloquear usuarios
- Eliminar usuarios
- Acciones masivas (bulk actions)
- Exportar a CSV

### 💸 Enviar Dinero
- Búsqueda de destinatario
- Formulario con conversión automática USD ↔ Bs
- Historial de transferencias
- Registro en Supabase

### 📣 Notificaciones
- Envío masivo o individual
- 4 tipos: Info, Éxito, Advertencia, Error
- Vista previa en tiempo real
- Historial de notificaciones

### 📝 Logs de Actividad
- Registro de todas las acciones admin
- Búsqueda y filtros
- Exportar a CSV
- Persistencia en Supabase

### ⚙️ Configuración
- Cambiar contraseña de admin
- Limpiar caché
- Información del sistema

---

## 🎨 Características Técnicas

### ✅ Ventajas de la Arquitectura Modular

1. **Separación de Responsabilidades**
   - Cada módulo tiene una función específica
   - Fácil de mantener y debuggear

2. **Reutilización de Código**
   - AdminUtils se puede usar en cualquier módulo
   - AdminSupabase centraliza todas las operaciones DB

3. **Escalabilidad**
   - Fácil agregar nuevas funcionalidades
   - Módulos independientes = menos errores

4. **Testing**
   - Cada módulo se puede testear por separado
   - Menos dependencias = más fácil de probar

5. **NO Afecta el Frontend**
   - Todo el sistema admin es independiente
   - El flujo de usuario permanece intacto

---

## 🔌 Integración con Supabase

### Tablas Necesarias en Supabase

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    balance JSONB DEFAULT '{"usd": 0, "bs": 0, "eur": 0}'::jsonb,
    auth_provider TEXT DEFAULT 'email',
    status TEXT DEFAULT 'active',
    blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de transferencias admin
CREATE TABLE admin_transfers (
    id TEXT PRIMARY KEY,
    recipient TEXT,
    recipient_name TEXT,
    amount_usd DECIMAL,
    amount_bs DECIMAL,
    concept TEXT,
    admin TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE admin_notifications (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    message TEXT,
    target TEXT,
    recipient_count INTEGER,
    admin TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs
CREATE TABLE admin_logs (
    id TEXT PRIMARY KEY,
    action TEXT,
    description TEXT,
    admin TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Cómo Usar

### Para el Administrador:
1. Abrir `admin-registros.html`
2. Login con `admin/admin123`
3. Gestionar usuarios, enviar dinero, notificaciones, etc.

### Para el Usuario (NO CAMBIA):
1. `index.html` → `registro.html` → `homevisa.html`
2. Todo funciona exactamente igual

---

## 📝 Notas Importantes

- ✅ **Sin Backend Tradicional:** Todo usa Supabase
- ✅ **Compatible con Vercel:** No hay funciones serverless complejas
- ✅ **Frontend NO Modificado:** El flujo de usuario permanece intacto
- ✅ **Modular:** Fácil de extender y mantener
- ✅ **Persistencia Dual:** localStorage + Supabase
- ✅ **Responsive:** Funciona en móvil, tablet y desktop

---

## 🔧 Mantenimiento

### Agregar Nueva Funcionalidad:
1. Si es una utilidad general → `admin-utils.js`
2. Si es una operación DB → `admin-supabase.js`
3. Si es lógica de negocio → `admin-backend.js`
4. Si es UI → `admin-registros.js`

### Debugging:
- Cada módulo tiene `console.log` con prefijo `[NombreModulo]`
- Fácil identificar dónde ocurre un error

---

## 📈 Próximas Mejoras Sugeridas

1. **Sistema de Roles**
   - Múltiples niveles de administrador
   - Permisos granulares

2. **Reportes Avanzados**
   - Gráficas con Chart.js
   - Exportar a PDF

3. **Notificaciones en Tiempo Real**
   - WebSockets o Supabase Realtime
   - Push notifications

4. **Auditoría Detallada**
   - Rastreo de cambios
   - Historial completo

---

**Creado por:** Claude
**Fecha:** 2025-11-01
**Versión:** 1.0.0
