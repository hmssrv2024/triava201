# 📘 GUÍA COMPLETA: Panel de Administración REMEEX VISA

## 🎯 RESUMEN EJECUTIVO

Este panel te permite gestionar todos los usuarios de REMEEX VISA desde una interfaz visual moderna y fácil de usar.

**URL:** `/admin-usuarios.html`

---

## 🚀 CÓMO ACCEDER

### **PASO 1: Iniciar Sesión como Admin**

1. Abre: `/admin-login.html`
2. Ingresa credenciales de administrador:
   - **Usuario:** `admin`
   - **Contraseña:** `Caracas1215**`
3. Haz clic en "Iniciar Sesión"

### **PASO 2: Ir al Panel de Usuarios**

Una vez dentro, tienes 2 opciones:
- **Opción A:** Ir a `/admin-usuarios.html` directamente
- **Opción B:** Desde `/admin-registros.html`, buscar el enlace al panel de usuarios

---

## 📊 DASHBOARD - ESTADÍSTICAS EN TIEMPO REAL

Al abrir el panel verás 4 tarjetas con estadísticas:

| Estadística | Descripción |
|-------------|-------------|
| **Usuarios Totales** | Cantidad total de usuarios registrados |
| **Usuarios Online** | Cuántos usuarios están conectados ahora |
| **Balance Total** | Suma de todos los balances del sistema |
| **Usuarios Bloqueados** | Cantidad de cuentas bloqueadas |

**Actualizar estadísticas:** Haz clic en el botón "🔄 Actualizar" en la esquina superior derecha.

---

## 🔍 BUSCAR Y FILTRAR USUARIOS

### **Búsqueda por Texto**
```
🔍 Buscar por nombre, email o documento...
```

Puedes buscar por:
- ✅ Nombre completo (ejemplo: "Juan Pérez")
- ✅ Email (ejemplo: "juan@ejemplo.com")
- ✅ Número de documento (ejemplo: "12345678")

### **Filtro por Estado**
```
Dropdown: "Todos los estados"
```

Opciones:
- **Todos los estados:** Muestra todos
- **Activos:** Solo usuarios no bloqueados
- **Bloqueados:** Solo usuarios bloqueados
- **Pendientes:** Solo usuarios sin validar

### **Filtro por Conexión**
```
Dropdown: "Online/Offline"
```

Opciones:
- **Online/Offline:** Muestra todos
- **Solo Online:** Solo usuarios conectados ahora
- **Solo Offline:** Solo usuarios desconectados

---

## 👥 TABLA DE USUARIOS

La tabla muestra:

| Columna | Información |
|---------|-------------|
| **Usuario** | Avatar circular con inicial + Nombre + Email |
| **Documento** | Tipo (CI/Pasaporte/Licencia) + Número |
| **Balance** | Balance actual en USD |
| **Estado** | Punto verde/gris (online/offline) + Badge (activo/bloqueado) |
| **Validado** | Si el usuario completó la validación |
| **Acciones** | Botones de acción rápida |

---

## 🎯 ACCIONES DE ADMINISTRACIÓN

Cada usuario tiene 5 botones de acción:

### **1️⃣ Enviar Dinero (💰)**

**¿Qué hace?**
Envía una transferencia al usuario que debe aceptar/rechazar.

**Cómo usar:**
1. Haz clic en el botón azul 💰
2. Se abre un modal con:
   - Usuario (solo lectura)
   - Monto (USD)
   - Descripción
3. Ingresa el monto y descripción
4. Haz clic en "Enviar"

**¿Qué pasa después?**
- El usuario recibe un **overlay de notificación**
- Puede **aceptar** → El dinero se suma a su balance
- Puede **rechazar** → La transferencia se cancela
- La transferencia expira en 7 días si no responde

**Ejemplo:**
```
Usuario: Juan Pérez (juan@ejemplo.com)
Monto: 100.00 USD
Descripción: Reembolso por error en transacción
```

---

### **2️⃣ Bloquear Usuario (🔒)**

**¿Qué hace?**
Bloquea completamente la cuenta del usuario.

**Cómo usar:**
1. Haz clic en el botón rojo 🔒
2. Se abre un modal con:
   - Usuario (solo lectura)
   - Motivo del bloqueo
3. Escribe el motivo (obligatorio)
4. Haz clic en "Bloquear"

**¿Qué pasa después?**
- El usuario NO puede iniciar sesión
- Si ya está conectado, se cierra su sesión
- Recibe un **overlay** explicando el bloqueo
- Aparece en el filtro "Bloqueados"

**Ejemplo:**
```
Usuario: María García (maria@ejemplo.com)
Motivo: Actividad sospechosa detectada. Contactar soporte.
```

**⚠️ Importante:** El bloqueo es inmediato y el usuario no puede acceder hasta que lo desbloquees.

---

### **3️⃣ Desbloquear Usuario (🔓)**

**¿Qué hace?**
Desbloquea una cuenta previamente bloqueada.

**Cómo usar:**
1. Haz clic en el botón verde 🔓 (solo aparece si el usuario está bloqueado)
2. Confirma la acción
3. El usuario queda desbloqueado inmediatamente

**¿Qué pasa después?**
- El usuario puede iniciar sesión nuevamente
- Desaparece del filtro "Bloqueados"
- Se registra en el log de actividad

---

### **4️⃣ Enviar Notificación (🔔)**

**¿Qué hace?**
Envía un mensaje personalizado al usuario.

**Cómo usar:**
1. Haz clic en el botón naranja 🔔
2. Se abre un modal con:
   - Usuario (solo lectura)
   - Título
   - Mensaje
   - Tipo (info/success/warning/error)
   - Checkbox "Mostrar como overlay"
3. Completa todos los campos
4. Haz clic en "Enviar"

**Tipos de notificación:**
- **Información (azul):** Mensajes generales
- **Éxito (verde):** Confirmaciones positivas
- **Advertencia (amarillo):** Alertas importantes
- **Error (rojo):** Problemas urgentes

**Ejemplo:**
```
Usuario: Pedro Ramírez (pedro@ejemplo.com)
Título: Actualización del sistema
Mensaje: Mañana realizaremos mantenimiento de 2:00 AM a 4:00 AM. Tu cuenta no se verá afectada.
Tipo: Información
☑ Mostrar como overlay
```

**¿Qué pasa después?**
- Si marcaste "overlay" → El usuario ve un popup grande en pantalla
- Si NO marcaste "overlay" → Aparece como notificación pequeña
- La notificación queda guardada en su historial

---

### **5️⃣ Ver Detalles (👁️)**

**¿Qué hace?**
Muestra información detallada del usuario.

**Cómo usar:**
1. Haz clic en el botón morado 👁️
2. (Función en desarrollo - por ahora muestra un alert)

**Próximamente mostrará:**
- Historial de transacciones completo
- Historial de login (IPs, dispositivos)
- Historial de notificaciones enviadas
- Documentos adjuntos
- Log de actividad del admin sobre este usuario

---

## 🎨 GUÍA VISUAL DE ESTADOS

### **Estados de Usuario**

| Estado | Apariencia | Significado |
|--------|-----------|-------------|
| **Online** | 🟢 Online + Badge verde "Activo" | Conectado ahora |
| **Offline** | ⚫ Offline + Badge verde "Activo" | Desconectado pero cuenta activa |
| **Bloqueado** | 🟢/⚫ + Badge rojo "Bloqueado" | Cuenta suspendida |
| **Validado** | Badge verde "Sí" | Usuario completó validación |
| **Sin validar** | Badge amarillo "No" | Usuario pendiente de validar |

### **Colores de Botones**

| Botón | Color | Acción |
|-------|-------|--------|
| 💰 | Azul | Enviar dinero (no destructivo) |
| 🔒 | Rojo | Bloquear (destructivo) |
| 🔓 | Verde | Desbloquear (restaurar) |
| 🔔 | Naranja | Notificar (informar) |
| 👁️ | Morado | Ver detalles (solo lectura) |

---

## 📝 FLUJOS DE TRABAJO COMUNES

### **Flujo 1: Reembolsar dinero a un usuario**

```
1. Buscar usuario por email o nombre
2. Verificar su balance actual
3. Clic en botón 💰
4. Ingresar monto y descripción clara
5. Enviar
6. Usuario recibe overlay
7. Usuario acepta
8. Balance se actualiza automáticamente
```

### **Flujo 2: Bloquear cuenta sospechosa**

```
1. Filtrar por "Solo Online" (para ver actividad actual)
2. Identificar usuario sospechoso
3. Clic en botón 🔒
4. Escribir motivo detallado
5. Bloquear
6. Usuario se desconecta inmediatamente
7. Verificar en filtro "Bloqueados"
```

### **Flujo 3: Notificar a todos sobre mantenimiento**

```
1. Remover todos los filtros (ver todos)
2. Para cada usuario importante:
   - Clic en 🔔
   - Título: "Mantenimiento programado"
   - Tipo: Warning
   - Marcar overlay
   - Enviar
3. Los usuarios reciben popup al conectarse
```

### **Flujo 4: Investigar usuario con problema**

```
1. Buscar usuario
2. Verificar estado (online/offline)
3. Ver su balance
4. Clic en 👁️ (cuando esté listo) para ver historial
5. Si es necesario, enviar notificación o bloquear
```

---

## ⚙️ CONFIGURACIÓN Y MANTENIMIENTO

### **Actualizar Datos**

El panel se actualiza automáticamente al:
- ✅ Abrir la página
- ✅ Hacer clic en "🔄 Actualizar"
- ✅ Completar una acción (enviar dinero, bloquear, etc.)

### **Refrescar Manualmente**

Si ves datos desactualizados:
1. Haz clic en "🔄 Actualizar" (arriba a la derecha)
2. O recarga la página (F5)

### **Logs de Actividad**

Todas tus acciones como admin quedan registradas en:
- Tabla `admin_activity_log` en Supabase
- Incluye: fecha, admin, acción, usuario afectado

Para ver los logs:
- Ve a Supabase → Table Editor → admin_activity_log

---

## 🔐 SEGURIDAD Y BUENAS PRÁCTICAS

### **✅ Hacer:**
- Siempre escribe motivos claros al bloquear
- Verifica dos veces antes de enviar dinero
- Usa notificaciones tipo "warning" para avisos importantes
- Revisa los filtros antes de tomar acciones masivas

### **❌ NO hacer:**
- NO bloquear sin motivo válido
- NO enviar dinero sin verificar el usuario
- NO usar notificaciones tipo "error" para información general
- NO dejar el panel abierto sin supervisión

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### **Problema 1: "No se cargan los usuarios"**

**Causa:** Supabase no está conectado o hay un error de red

**Solución:**
1. Verifica tu conexión a internet
2. Abre la consola del navegador (F12)
3. Busca errores en rojo
4. Si ves "Supabase not ready", recarga la página
5. Si persiste, verifica las credenciales de Supabase

---

### **Problema 2: "No puedo enviar dinero"**

**Causa:** El usuario no tiene balance creado o hay un error en la función

**Solución:**
1. Verifica que el usuario tenga una fila en `user_balances`
2. Si no existe, se crea automáticamente al primer registro
3. Ejecuta: `SELECT * FROM user_balances WHERE user_email = 'email@usuario.com'`
4. Si no existe, crea manualmente:
   ```sql
   INSERT INTO user_balances (user_email, current_balance, available_balance, reserved_balance, currency)
   VALUES ('email@usuario.com', 0, 0, 0, 'USD');
   ```

---

### **Problema 3: "Las notificaciones no aparecen al usuario"**

**Causa:** El usuario no tiene el sistema de notificaciones activado o está offline

**Solución:**
1. Verifica que el usuario esté en `/homevisa.html`
2. Verifica que haya iniciado sesión (debe tener sesión válida)
3. Abre la consola en la cuenta del usuario
4. Busca: `[UserNotificationSystem] iniciado`
5. Si no aparece, el usuario debe recargar la página

---

### **Problema 4: "El overlay no se muestra"**

**Causa:** El checkbox "Mostrar como overlay" no estaba marcado

**Solución:**
1. Al enviar notificación, verifica que ☑ "Mostrar como overlay" esté marcado
2. Si ya enviaste sin marcarlo, envía una nueva notificación
3. Los overlays tienen prioridad sobre notificaciones normales

---

## 📊 MÉTRICAS Y REPORTES

### **Estadísticas Disponibles**

El dashboard muestra:
- Total de usuarios
- Usuarios online (actualizados en tiempo real)
- Balance total del sistema
- Usuarios bloqueados

### **Próximas Mejoras**

En futuras versiones:
- 📈 Gráficos de crecimiento de usuarios
- 💰 Historial de transacciones admin
- 📧 Exportar lista de usuarios a CSV
- 🔔 Notificaciones masivas a todos
- 📊 Dashboard de métricas avanzadas

---

## 🎓 CASOS DE USO REALES

### **Caso 1: Usuario reporta que no recibió un pago**

**Solución:**
1. Buscar usuario por email
2. Verificar su balance
3. Si es correcto → Enviar notificación explicando
4. Si falta dinero → Enviar transferencia con descripción del ajuste
5. Usuario acepta y problema resuelto

---

### **Caso 2: Usuario intenta hacer phishing**

**Solución:**
1. Identificar usuario sospechoso
2. Bloquear inmediatamente con motivo: "Actividad fraudulenta detectada"
3. El usuario no puede acceder más
4. Revisar logs de actividad en Supabase
5. Contactar autoridades si es necesario

---

### **Caso 3: Mantenimiento programado**

**Solución:**
1. 24 horas antes: Enviar notificación tipo "warning" con overlay
2. 1 hora antes: Enviar recordatorio tipo "warning"
3. Durante mantenimiento: Los usuarios ven mensaje al intentar acceder
4. Después: Enviar notificación tipo "success" confirmando

---

## 📱 USO EN MÓVIL

El panel es **responsive** y funciona en móviles:

- ✅ Dashboard se adapta a 1 columna
- ✅ Tabla se desplaza horizontalmente
- ✅ Botones de acción apilados verticalmente
- ✅ Modales ocupan toda la pantalla
- ✅ Filtros se apilan verticalmente

**Recomendación:** Para mejor experiencia, usa tablet o computadora.

---

## 🔗 INTEGRACIONES

### **Con Supabase:**
- Lee usuarios de: `registrations`
- Lee balances de: `user_balances`
- Crea transferencias en: `pending_transfers`
- Crea notificaciones en: `notifications`
- Registra actividad en: `admin_activity_log`

### **Con admin-manager.js:**
- Todas las acciones usan métodos de AdminManager
- Manejo automático de errores
- Validaciones antes de enviar a Supabase

### **Con user-notifications.js:**
- Los usuarios reciben notificaciones en tiempo real
- Polling cada 10 segundos
- Overlays automáticos

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de usar el panel en producción:

- [ ] ✅ Ejecutaste `SUPABASE_ADMIN_SCHEMA.sql` en Supabase
- [ ] ✅ Ejecutaste `SUPABASE_USER_AUTH_V2.sql` en Supabase
- [ ] ✅ Verificaste que existen las 6 funciones en Supabase
- [ ] ✅ Probaste enviar dinero a un usuario de prueba
- [ ] ✅ Probaste bloquear y desbloquear
- [ ] ✅ Probaste enviar notificación con overlay
- [ ] ✅ Verificaste que los filtros funcionan
- [ ] ✅ Verificaste que las estadísticas son correctas

---

## 🎉 ¡LISTO!

Ahora tienes un panel de administración completo y profesional para gestionar todos los usuarios de REMEEX VISA.

**URL de acceso:**
```
https://tu-dominio.vercel.app/admin-usuarios.html
```

**Credenciales de admin:**
```
Usuario: admin
Contraseña: Caracas1215**
```

---

## 📞 SOPORTE

Si tienes dudas o problemas:
1. Revisa esta guía completa
2. Abre la consola del navegador (F12) y busca errores
3. Verifica los logs en Supabase
4. Contacta al equipo de desarrollo

**¡Disfruta gestionando tu plataforma!** 🚀
