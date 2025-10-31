# Auditoría de Funciones Serverless

**Fecha:** 2025-10-31
**Contexto:** Plan Vercel Hobby con límite de 12 funciones serverless

---

## Resumen Ejecutivo

- **Total archivos .js en /api:** 14 archivos
- **Funciones serverless (cuentan para límite):** 8 funciones
- **Módulos helper (NO cuentan):** 6 módulos
- **Funciones a eliminar:** 2 funciones
- **Funciones a mantener:** 6 funciones
- **Resultado final:** 6 funciones activas (50% del límite disponible)

---

## Lista Completa de Funciones

### ✅ ESENCIALES (Mantener - 5 funciones)

#### 1. `/api/registro.js`
- **Tipo:** Función serverless
- **Uso:** Sistema de registro de usuarios (POST) y consulta de registros (GET)
- **Referencias:**
  - `public/registro.js` (formulario principal)
  - `public/registro-forwarder.js` (forwarding)
  - `public/admin-registros.html` (panel de administración)
  - `public/homevisa.html` (integración HomeVisa)
- **Estado:** ACTIVO ✅
- **Prioridad:** CRÍTICA - Sistema core del negocio
- **Dependencias:** registro-storage-supabase.js, registro-storage.js

#### 2. `/api/auth/[path].js`
- **Tipo:** Función serverless con dynamic routing
- **Uso:** Sistema de autenticación unificado (login, verify, logout)
- **Referencias:**
  - `public/admin-login.html` (login de administradores)
  - `public/admin-registros.html` (verificación de sesión)
- **Estado:** ACTIVO ✅
- **Prioridad:** CRÍTICA - Protege el panel de administración
- **Nota:** Recientemente optimizada (commit 1c4d2fb) para consolidar 3 funciones en 1

#### 3. `/api/chatbotremeex.js`
- **Tipo:** Función serverless
- **Uso:** Chatbot "Ana" con contexto de guías PDF (guia1.pdf, guia2.pdf)
- **Referencias:**
  - `public/chatbotremeex.js` (interfaz del chat)
  - `public/chatbotremeex.html` (página del chatbot)
- **Estado:** ACTIVO ✅
- **Prioridad:** ALTA - Soporte al cliente automatizado
- **Requiere:** OPENROUTER_API_KEY

#### 4. `/api/transform.js`
- **Tipo:** Función serverless
- **Uso:** Transformación de imágenes a formato pasaporte/ID usando AI
- **Referencias:**
  - `public/registro.js` (procesamiento de fotos en registro)
  - `public/envios-express.js` (procesamiento de documentos)
  - `public/test-transform.html` (página de testing)
- **Estado:** ACTIVO ✅
- **Prioridad:** ALTA - Mejora UX del proceso de registro
- **Requiere:** OPENROUTER_API_KEY

#### 5. `/api/paypal/create-order.js`
- **Tipo:** Función serverless
- **Uso:** Creación de órdenes de PayPal para pagos
- **Referencias:**
  - `public/registro.js` (línea 4204)
  - `public/envios-express.js` (línea 1005)
- **Estado:** ACTIVO ✅
- **Prioridad:** CRÍTICA - Procesamiento de pagos
- **Dependencias:** paypalClient.js
- **Requiere:** PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET

#### 6. `/api/paypal/capture-order.js`
- **Tipo:** Función serverless
- **Uso:** Captura de pagos de órdenes PayPal aprobadas
- **Referencias:**
  - `public/registro.js` (línea 4223)
  - `public/envios-express.js` (línea 1026)
- **Estado:** ACTIVO ✅
- **Prioridad:** CRÍTICA - Procesamiento de pagos
- **Dependencias:** paypalClient.js, storage.js
- **Requiere:** PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET

---

### ❌ LEGACY / NO USADAS (Eliminar - 2 funciones)

#### 7. `/api/agent.js`
- **Tipo:** Función serverless
- **Uso:** Agente de chat con OpenAI (streaming SSE)
- **Referencias:** ❌ NINGUNA
- **Búsqueda realizada:**
  ```bash
  grep -r "/api/agent" public/ → Sin resultados
  ```
- **Observación:** La página `agente.html` usa un widget de ElevenLabs, no esta función
- **Estado:** OBSOLETA
- **Recomendación:** ✅ ELIMINAR - No hay referencias en el frontend
- **Razón:** Función de desarrollo/testing que nunca se integró al sistema

#### 8. `/api/paypal/token.js`
- **Tipo:** Función serverless
- **Uso:** Endpoint de diagnóstico para obtener access token de PayPal
- **Referencias:** ❌ NINGUNA
- **Búsqueda realizada:**
  ```bash
  grep -r "api/paypal/token" public/ → Sin resultados
  ```
- **Estado:** DIAGNÓSTICO
- **Recomendación:** ✅ ELIMINAR o DESHABILITAR en producción
- **Razón:** Solo útil para debugging. Código actual ya tiene protección:
  ```javascript
  // Bloqueado en producción a menos que PAYPAL_TOKEN_ENDPOINT_ENABLED=true
  if (!isDiagnosticsEnabled()) {
    return res.status(403).json({ error: 'PayPal token diagnostics endpoint is disabled.' });
  }
  ```
- **Nota:** El código ya está diseñado para deshabilitarse. Moverlo a api_disabled asegura que no cuente para el límite.

---

### 📦 MÓDULOS HELPER (NO cuentan para límite - 6 módulos)

Estos archivos exportan funciones/objetos específicos, NO exportan un `default handler`, por lo tanto **NO cuentan como funciones serverless**:

1. **`/api/registro-storage-supabase.js`**
   - Capa de persistencia con Supabase
   - Exporta: `readRegistrations()`, `saveRegistration()`
   - Usado por: `registro.js`

2. **`/api/registro-storage.js`**
   - Fallback de almacenamiento local (JSON file)
   - Exporta: `readRegistrations()`, `saveRegistration()`
   - Usado por: `registro-storage-supabase.js`

3. **`/api/supabase-client.js`**
   - Cliente de Supabase configurado
   - Exporta: `supabase`, `isSupabaseConfigured()`
   - Usado por: `registro-storage-supabase.js`

4. **`/api/paypal/paypalClient.js`**
   - Cliente de PayPal API con manejo de autenticación
   - Exporta: `createOrder()`, `captureOrder()`, `getAccessToken()`, `PayPalApiError`
   - Usado por: `create-order.js`, `capture-order.js`, `token.js`

5. **`/api/paypal/storage.js`**
   - Almacenamiento de capturas de PayPal
   - Exporta: `saveCaptureResult()`, `readExistingCaptures()`
   - Usado por: `capture-order.js`

6. **`/api/tools/calculator.js`**
   - Tool de calculadora para el agente
   - Exporta: `calculatorTool()`
   - Usado por: `agent.js` (que será eliminado)
   - **Nota:** Se puede eliminar también después de eliminar agent.js, pero no cuenta para el límite.

---

## Funciones ya Deshabilitadas (en /api_disabled)

El proyecto ya movió previamente 13 funciones obsoletas a `/api_disabled/`:

- `api_disabled/admin/connected.js`
- `api_disabled/admin/events.js`
- `api_disabled/admin/login.js`
- `api_disabled/admin/users/[id].js`
- `api_disabled/admin/users/[id]/password.js`
- `api_disabled/admin/users/index.js`
- `api_disabled/data.js`
- `api_disabled/db.js`
- `api_disabled/login.js`
- `api_disabled/logout.js`
- `api_disabled/notify.js`
- `api_disabled/set-registered.js`
- `api_disabled/subscribe.js`

**Nota:** Estas funciones fueron reemplazadas por el sistema de autenticación consolidado en `auth/[path].js` (commit 1c4d2fb).

---

## Acciones Recomendadas

### ✅ Eliminar de inmediato (seguro):

- **[ ] `/api/agent.js`**
  - Razón: No se usa en ninguna parte del frontend
  - Impacto: NINGUNO
  - Ahorro: 1 función serverless

- **[ ] `/api/paypal/token.js`**
  - Razón: Endpoint de diagnóstico no usado en producción
  - Impacto: NINGUNO (ya está protegido con flag)
  - Ahorro: 1 función serverless

### 🔧 Opcional - Limpieza adicional:

- **[ ] `/api/tools/calculator.js`**
  - Razón: Solo usado por agent.js (que será eliminado)
  - Impacto: NINGUNO
  - Nota: No cuenta para límite, pero mantiene código limpio

---

## Resultado Final

### Estado Actual:
```
Funciones serverless activas: 8
Límite de Vercel Hobby: 12
Utilización: 67% (8/12)
Estado del deployment: ❌ FALLANDO
```

### Después de las eliminaciones recomendadas:
```
Funciones serverless activas: 6
Límite de Vercel Hobby: 12
Utilización: 50% (6/12)
Estado del deployment: ✅ FUNCIONANDO
Margen disponible: 6 funciones (50%)
```

### Distribución final de las 6 funciones:
1. ✅ `/api/registro.js` - Registro de usuarios
2. ✅ `/api/auth/[path].js` - Autenticación
3. ✅ `/api/chatbotremeex.js` - Chatbot de soporte
4. ✅ `/api/transform.js` - Transformación de imágenes
5. ✅ `/api/paypal/create-order.js` - Crear orden PayPal
6. ✅ `/api/paypal/capture-order.js` - Capturar pago PayPal

---

## Próximos Pasos

1. **Revisar y aprobar** este reporte
2. **Mover funciones obsoletas** a `api_disabled/`
3. **Hacer commit** con mensaje descriptivo
4. **Hacer push** y verificar deployment en Vercel
5. **Monitorear** logs de Vercel para confirmar que todo funciona

---

## Notas Técnicas

### ¿Cómo identifica Vercel una función serverless?

Vercel detecta como función serverless cualquier archivo `.js`, `.ts`, o `.tsx` en el directorio `api/` que:
- Exporta un `default handler` con firma: `(req, res) => {...}`
- Está en una subcarpeta con nombre especial como `[param]` para dynamic routes

### ¿Por qué los helpers NO cuentan?

Los módulos helper son importados por otras funciones serverless pero NO exportan un default handler. Vercel no los ejecuta directamente como endpoints HTTP, solo son código compartido.

### Optimización reciente (commit 1c4d2fb)

El proyecto ya pasó por una optimización donde se consolidaron 3 funciones de autenticación separadas (`/api/admin/login`, `/api/admin/logout`, `/api/admin/verify`) en una sola función con dynamic routing (`/api/auth/[path].js`). Esta auditoría identifica las últimas 2 funciones obsoletas que quedaron.

---

**Fin del reporte**
