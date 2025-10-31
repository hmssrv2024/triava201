# 📚 Guía de APIs de Usuario - REMEEX VISA

Esta guía explica cómo usar las APIs de Supabase para gestionar usuarios, saldos, transacciones y sesiones en homevisa.html.

## 🎯 Resumen

**Endpoint base**: `/api/user/[action]`

**Tablas de Supabase**:
- `registrations` - Datos del usuario
- `user_balances` - Saldo del usuario
- `user_transactions` - Historial de transacciones
- `user_sessions` - Control de sesiones online/offline

---

## 📡 Endpoints Disponibles

### 1. **Obtener Saldo** 💰

```http
GET /api/user/balance?email=usuario@ejemplo.com
```

**Respuesta exitosa**:
```json
{
  "ok": true,
  "data": {
    "email": "usuario@ejemplo.com",
    "currentBalance": 150.50,
    "availableBalance": 150.50,
    "reservedBalance": 0.00,
    "currency": "USD",
    "lastTransaction": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Nota**: Si el usuario no tiene balance creado, se crea automáticamente con $0.00

---

### 2. **Historial de Transacciones** 📊

```http
GET /api/user/transactions?email=usuario@ejemplo.com&limit=50&offset=0
```

**Parámetros opcionales**:
- `limit` - Número de transacciones (default: 50)
- `offset` - Paginación (default: 0)
- `type` - Filtrar por tipo: `deposit`, `withdrawal`, `transfer_in`, `transfer_out`, `payment`, `refund`

**Respuesta exitosa**:
```json
{
  "ok": true,
  "data": {
    "transactions": [
      {
        "id": "uuid-xxx",
        "type": "deposit",
        "amount": 100.00,
        "balanceBefore": 50.50,
        "balanceAfter": 150.50,
        "currency": "USD",
        "description": "Recarga inicial",
        "status": "completed",
        "referenceId": "REF-123",
        "externalReference": "PAYPAL-456",
        "metadata": { "method": "paypal" },
        "date": "2025-01-15T10:30:00Z",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  }
}
```

**Tipos de transacción**:
- `deposit` - Depósito/recarga
- `withdrawal` - Retiro
- `transfer_in` - Transferencia recibida
- `transfer_out` - Transferencia enviada
- `payment` - Pago realizado
- `refund` - Reembolso

**Estados**:
- `pending` - Pendiente
- `completed` - Completada
- `failed` - Fallida
- `cancelled` - Cancelada

---

### 3. **Crear/Actualizar Sesión** 🟢

```http
POST /api/user/session
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Respuesta exitosa**:
```json
{
  "ok": true,
  "data": {
    "sessionId": "uuid-xxx",
    "sessionToken": "token-xxx",
    "isOnline": true,
    "loginTime": "2025-01-15T10:00:00Z",
    "lastActivity": "2025-01-15T10:00:00Z"
  }
}
```

**Nota**: Si ya existe una sesión activa, se actualiza el campo `last_activity`

---

### 4. **Obtener Sesión Actual** 🔍

```http
GET /api/user/session?email=usuario@ejemplo.com
```

**Respuesta (usuario online)**:
```json
{
  "ok": true,
  "data": {
    "isOnline": true,
    "sessionId": "uuid-xxx",
    "loginTime": "2025-01-15T10:00:00Z",
    "lastActivity": "2025-01-15T10:30:00Z",
    "ipAddress": "192.168.1.1"
  }
}
```

**Respuesta (usuario offline)**:
```json
{
  "ok": true,
  "data": {
    "isOnline": false,
    "session": null
  }
}
```

---

### 5. **Cerrar Sesión** 🔴

```http
POST /api/user/logout
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa**:
```json
{
  "ok": true,
  "message": "Sesión cerrada correctamente"
}
```

---

### 6. **Obtener Perfil de Usuario** 👤

```http
GET /api/user/profile?email=usuario@ejemplo.com
```

**Respuesta exitosa**:
```json
{
  "ok": true,
  "data": {
    "id": "uuid-xxx",
    "email": "usuario@ejemplo.com",
    "fullName": "Juan Pérez",
    "firstName": "Juan",
    "lastName": "Pérez",
    "preferredName": "Juanito",
    "nickname": "JP",
    "country": "Venezuela",
    "state": "Caracas",
    "phone": "+58 424 1234567",
    "documentType": "Pasaporte",
    "documentNumber": "V12345678",
    "accountStatus": "active",
    "isVerified": true,
    "emailVerified": true,
    "lastLogin": "2025-01-15T10:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## 🚀 Uso en Frontend (homevisa.html)

### **Paso 1: Incluir el script**

Agrega en `homevisa.html` antes de `</body>`:

```html
<script src="js/supabase-integration.js" defer></script>
```

### **Paso 2: Inicializar**

```javascript
// Opción 1: Auto-inicialización (detecta email automáticamente)
// El script busca elementos con ID: welcome-email, user-email o [data-user-email]

// Opción 2: Inicialización manual
const userEmail = 'usuario@ejemplo.com';
window.RemeexSupabase.init(userEmail);
```

### **Paso 3: Usar eventos personalizados**

```javascript
// Escuchar cuando se actualiza el saldo
window.addEventListener('supabase:balance-updated', (event) => {
  const balance = event.detail;
  console.log('Saldo actual:', balance.currentBalance);
  console.log('Saldo disponible:', balance.availableBalance);
});

// Escuchar cuando se cargan transacciones
window.addEventListener('supabase:transactions-updated', (event) => {
  const transactions = event.detail.transactions;
  console.log('Total transacciones:', transactions.length);

  // Mostrar en UI
  transactions.forEach(tx => {
    console.log(`${tx.type}: $${tx.amount} - ${tx.description}`);
  });
});

// Escuchar cambios de sesión
window.addEventListener('supabase:session-updated', (event) => {
  const isOnline = event.detail.isOnline;
  console.log('Usuario online:', isOnline);
});
```

### **Paso 4: API pública**

```javascript
// Obtener saldo actual
const balance = window.RemeexSupabase.getBalance();
console.log('Saldo:', balance.currentBalance);

// Obtener transacciones
const transactions = window.RemeexSupabase.getTransactions();
console.log('Transacciones:', transactions);

// Refrescar datos manualmente
await window.RemeexSupabase.refresh();

// Verificar si está online
const isOnline = window.RemeexSupabase.isOnline();

// Cerrar sesión
await window.RemeexSupabase.logout();
```

---

## 📊 Ejemplo Completo de Integración

```html
<!DOCTYPE html>
<html>
<head>
  <title>REMEEX VISA</title>
</head>
<body>
  <div id="dashboard">
    <h1>Bienvenido, <span id="welcome-email">usuario@ejemplo.com</span></h1>

    <div class="balance-card">
      <h2>Saldo Disponible</h2>
      <p id="user-balance">$0.00</p>
    </div>

    <div class="transactions">
      <h2>Últimas Transacciones</h2>
      <ul id="transactions-list"></ul>
    </div>

    <div class="status">
      Estado: <span data-online-status>Desconectado</span>
    </div>
  </div>

  <script src="js/supabase-integration.js" defer></script>
  <script>
    // Escuchar eventos
    window.addEventListener('supabase:balance-updated', (event) => {
      const balance = event.detail;
      document.getElementById('user-balance').textContent =
        `$${balance.currentBalance.toFixed(2)}`;
    });

    window.addEventListener('supabase:transactions-updated', (event) => {
      const transactions = event.detail.transactions;
      const list = document.getElementById('transactions-list');

      list.innerHTML = transactions.map(tx => `
        <li>
          <strong>${tx.type}</strong>: $${tx.amount.toFixed(2)}
          <br>${tx.description}
          <br><small>${new Date(tx.date).toLocaleString()}</small>
        </li>
      `).join('');
    });

    // El script se auto-inicializa al detectar #welcome-email
  </script>
</body>
</html>
```

---

## ⚙️ Configuración Automática

El script `supabase-integration.js` incluye:

✅ **Auto-inicialización** - Detecta email automáticamente
✅ **Actualización automática** - Cada 30 segundos actualiza saldo y transacciones
✅ **Ping de sesión** - Cada 60 segundos actualiza `last_activity`
✅ **Cierre automático** - Al cerrar la página marca usuario offline
✅ **Formateo de moneda** - Formatea automáticamente USD/otras monedas
✅ **Manejo de errores** - Console.log detallado para debugging

---

## 🔧 Testing Manual

### **Probar balance**:
```bash
curl "https://visa.remeexvisa.com/api/user/balance?email=test@ejemplo.com"
```

### **Probar transacciones**:
```bash
curl "https://visa.remeexvisa.com/api/user/transactions?email=test@ejemplo.com&limit=10"
```

### **Probar sesión**:
```bash
curl -X POST https://visa.remeexvisa.com/api/user/session \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com"}'
```

---

## 📝 Notas Importantes

1. **Saldo inicial**: Todos los usuarios empiezan con $0.00 USD
2. **Creación automática**: Si un usuario no tiene balance, se crea automáticamente
3. **Sesiones múltiples**: Un usuario puede tener múltiples sesiones (diferentes dispositivos)
4. **Online/Offline**: Se marca offline automáticamente después de 5 minutos sin actividad
5. **Timezone**: Todas las fechas están en UTC (ISO 8601)

---

## 🎨 Elementos HTML Detectados Automáticamente

El script busca estos elementos para mostrar datos:

**Para saldo**:
- `#user-balance`
- `#current-balance`
- `#wallet-balance`
- `[data-balance]`
- `.balance-amount`
- `#exchange-available`

**Para email**:
- `#welcome-email`
- `#user-email`
- `[data-user-email]`

**Para estado online**:
- `[data-online-status]`

---

## ✅ Checklist de Implementación

- [ ] Incluir script en homevisa.html
- [ ] Agregar elemento con email del usuario
- [ ] Agregar elementos para mostrar saldo
- [ ] Crear listeners para eventos personalizados
- [ ] Probar en navegador (console.log muestra todo)
- [ ] Verificar en Supabase que se crean registros

---

## 🆘 Troubleshooting

**Problema**: No se carga el saldo
**Solución**: Verifica en console.log que el email esté detectado correctamente

**Problema**: Transacciones vacías
**Solución**: Normal si el usuario es nuevo. Agrega transacciones manualmente en Supabase para probar

**Problema**: No marca como online
**Solución**: Verifica que las credenciales de Supabase estén en Vercel

**Problema**: CORS errors
**Solución**: Los endpoints ya tienen CORS habilitado, verifica que estés en el dominio correcto

---

¿Preguntas? Verifica los logs en la consola del navegador con `[Supabase]` prefix.
