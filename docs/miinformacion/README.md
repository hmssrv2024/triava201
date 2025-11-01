# Mi Información (miinformacion.html)

La vista **Mi Información** funciona como consola de diagnóstico y sincronización
para cada usuario de Remeex VISA. Centraliza los datos almacenados en `localStorage`
y `sessionStorage`, publica snapshots en Supabase y envía instrucciones remotas que
son consumidas por otras interfaces como `homevisa.html`, `intercambio.html` y
`verificacion.html`.

Este documento resume la arquitectura del módulo y describe cómo utilizar las
nuevas capacidades de transferencias remotas entre usuarios.

## Flujo general

1. `miinformacion.html` recopila información local (registro, verificación,
   balances, historiales) y la muestra en tarjetas de diagnóstico.
2. Al presionar **“Enviar datos ahora”** se genera un snapshot (`miinformacion_snapshots`)
   con el estado completo de la cuenta y se envía a Supabase.
3. Las acciones remotas (bloqueos, actualización de saldos, overlays, etc.) se
guardan en la cola local `homevisaRemoteCommands`, se insertan en la tabla
   `miinformacion_remote_commands` y se sincronizan mediante `homevisa-remote-bridge.js`.
4. Las páginas consumidoras cargan la cola, ejecutan cada comando y lo marcan en
   `homevisaRemoteProcessed` para evitar duplicados.

## Acciones remotas disponibles

| Tipo (`type`)           | Descripción                                                    |
|-------------------------|----------------------------------------------------------------|
| `update-balance`        | Actualiza las cantidades guardadas en `remeexBalance`.         |
| `update-rate`           | Propaga la tasa seleccionada a `homevisa.html` e historial.    |
| `set-block`             | Activa o desactiva bloqueos manuales en HomeVisa.              |
| `wipe-account`          | Limpia claves locales de la cuenta del usuario.                |
| `set-validation-amount` | Fuerza un monto de validación para recargas supervisadas.      |
| `show-overlay`/`hide-overlay` | Controla los overlays promocionales/remotos.          |
| `send-funds` *(nuevo)*  | Registra transferencias entre dos usuarios de Remeex.          |

Todos los comandos guardan metadatos (`meta`) con el origen, referencias y la hora
de creación. Estos metadatos se envían a Supabase junto al `device_id` y correo del
usuario para su trazabilidad.

## Transferencias remotas entre usuarios

La nueva sección **“Transferencias entre usuarios”** del panel remoto permite
generar el comando `send-funds`.

Campos principales:

- **Tipo de operación** (`send` / `receive`):
  - `send` descuenta fondos del usuario activo y documenta una transferencia saliente.
  - `receive` acredita fondos como transferencia recibida.
- **Correo del otro usuario**: se usa para mostrar el contra-parte en el historial.
- **Monto** y **Moneda**: admite `USD`, `VES`/`Bs`, `EUR` o `USDT`. El monto se
  convierte automáticamente usando la última tasa almacenada.
- **Concepto o nota**: aparece en los historiales y en la bitácora general.
- **Referencia opcional**: si se proporciona, se usa como `transferId` para trazar la operación.

Al registrar una transferencia se generan los siguientes efectos:

1. Se crea un comando `send-funds` en la cola local y en Supabase.
2. `homevisa-remote-bridge.js` procesa el comando, ajusta los balances (`remeexBalance`
   y `remeexSessionBalance`), añade registros en `remeexTransactions` y
   `remeexExchangeHistory`, y despacha el evento `homevisa:remote-transfer`.
3. `intercambio.html` escucha ese evento, sincroniza su estado en memoria,
   actualiza la UI (saldo principal, historial, toasts) y guarda los cambios en
   almacenamiento local.

> **Nota:** Para crear una transferencia completa entre dos cuentas se deben
> registrar dos comandos, uno por cada lado (envío y recepción). Esto permite
> modelar aprobaciones parciales o revisiones manuales desde el panel de control.

## Integración con otras páginas

- **homevisa.html**: ya cargaba `js/homevisa-remote-bridge.js`. El manejador de
  `send-funds` mantiene la compatibilidad con los comandos existentes y actualiza
  cualquier overlay o bloqueo activo.
- **intercambio.html**: ahora también carga `js/homevisa-remote-bridge.js` y añade
  un listener para `homevisa:remote-transfer`, garantizando que el historial de
  intercambios y el saldo reflejen los comandos remotos en tiempo real.
- **verificacion.html** (u otras vistas que lean los mismos almacenamientos) se
  benefician de los cambios porque los datos en `localStorage` se mantienen
  sincronizados.

## Tablas de Supabase utilizadas

| Tabla                        | Finalidad                                           |
|-----------------------------|-----------------------------------------------------|
| `miinformacion_snapshots`   | Snapshots completos del estado del usuario.         |
| `miinformacion_remote_commands` | Registro histórico de acciones remotas ejecutadas. |

Cada comando enviado incluye:

- `command_id`: el identificador único generado en `miinformacion`.
- `type`: tipo de acción (por ejemplo `send-funds`).
- `payload`: datos originales enviados desde la interfaz.
- `meta`: origen, referencia y contexto adicional.
- `device_id`, `email`, `full_name`: ayudan a ubicar el dispositivo/usuario objetivo.

## Lógica del Prelogin Seguro

El flujo de **Prelogin Seguro** (`homevisa-prelogin.html` + `js/homevisa-prelogin.js`) es
el mecanismo de recuperación que rehidrata el almacenamiento local del usuario antes
de abrir `homevisa.html`. La lógica principal se basa en cuatro etapas:

1. **Preparación y diagnóstico:** la vista espera a que Supabase esté lista
   (`SupabaseDB.isReady()`), muestra el estado en `supabase-status` y, al salir del
   campo de correo, consulta `getProfile(email)` para recuperar el perfil. Con esa
   información refresca una tarjeta previa (nombre, correo, estado, bloqueos) y
   despliega la pregunta de seguridad guardada en Supabase.
2. **Validación de credenciales extendidas:** antes de sincronizar, el usuario debe
   proporcionar los cuatro factores registrados: contraseña, código de 20 dígitos,
   respuesta secreta y PIN. Se valida además un dígito opcional del documento y se
   detiene el proceso si la cuenta aparece bloqueada.
3. **Sincronización con Supabase:** al superar las validaciones se ejecuta
   `syncSupabase(profile)`, que llama a `getBalance`, `getTransactions`, `createSession`
   y al RPC `log_device_activity`. También intenta invocar `get_user_data` para traer
   tasas personalizadas y notificaciones no leídas. Con esta información calcula un
   `sessionId` temporal (`prelogin-<timestamp>`) y normaliza el historial de
   transacciones.
4. **Rehidratación local y redirección:** `persistRegistration` guarda en `localStorage`
   los módulos clave (`visaRegistrationCompleted`, `visaUserData`, `remeexBalance`,
   `remeexTransactions`, `homevisaSessionMonitor`, tasas y notificaciones). Finalmente
   muestra un mensaje de éxito y redirige a `homevisa.html?session=<sessionId>` para
   que el bridge remoto procese los nuevos datos.

> **Tip:** El código de 20 dígitos incorpora la tasa personalizada (`deriveRateFromCode`)
> y un patrón horario que se verifica con `isHourlyVerificationCode`. Si la tasa está
> presente se reconfigura `selectedRate` al momento de la rehidratación.

## Buenas prácticas

- Mantén abierto `miinformacion.html` cuando se utilicen comandos remotos para
  poder monitorear el resultado y el estado de Supabase.
- Verifica que las tasas estén actualizadas antes de ejecutar transferencias en
  VES o EUR para evitar diferencias en la conversión.
- Usa referencias consistentes (ej. `REM-2024-0001`) para facilitar auditorías en
  Supabase y en los historiales locales.
- En escenarios de pruebas, borra `homevisaRemoteProcessed` para volver a ejecutar
  comandos previamente procesados.

Para detalles adicionales sobre autenticación, estructura de supabase o
sincronización avanzada revisa los manuales complementarios ubicados en la raíz
(del tipo `GUIA_*` o `INTEGRACION_SUPABASE_COMPLETA.md`).
