# visaremeexplus

> [!NOTE]
> El backend está activo y se despliega junto al frontend en Vercel. Los endpoints dedicados a pagos viven bajo `api/paypal`, así que configura las credenciales antes de probarlos.

Este repositorio contiene una aplicación sencilla de ejemplo. Ahora incluye un pequeño backend en Node.js que permite que un administrador inicie sesión, consulte los usuarios conectados y cambie la clave de un usuario.

> [!TIP]
> Todo el contenido estático del sitio (páginas `.html`, hojas de estilo y medios) ahora vive dentro de `public/`. De esta forma basta con servir esa carpeta para visualizar cualquier pantalla sin rutas rotas. Puedes ejecutar `npm run dev` o lanzar un servidor estático (`python -m http.server 8000 --directory public`) y navegar directamente a `http://localhost:8000/` para revisar la web completa.

## Scripts disponibles

- `npm run build:dolarhoy`: genera el bundle ofuscado de la página `dolarhoy`, aplica la ofuscación avanzada y minifica el HTML para producción.
- `npm run build:dolarhoy:wasm`: compila las rutinas críticas en `wasm/` usando `wasm-pack` y deja el wrapper JavaScript junto con el binario `.wasm` en `public/js/`.

## Módulo WebAssembly para Dólar Hoy

Las funciones de cálculo `to_numeric_value`, `parse_amount_input`, `calculate_total` y `determine_trend` se implementaron en Rust dentro de `wasm/src/lib.rs` y se compilan a WebAssembly para blindar la lógica del convertidor y de la tendencia.
Ejecuta `npm run build:dolarhoy:wasm` (incluido automáticamente al correr `npm run build:dolarhoy`) para generar `public/js/dolarhoy_wasm.js` y `public/js/dolarhoy_wasm_bg.wasm` mediante `wasm-pack`.
Durante el build el wrapper queda en `public/js/` y `public/dolarhoy.html` lo carga con `import()` exponiendo la promesa `globalThis.__dolarhoyWasmReady__`.
Si el navegador no soporta WebAssembly, el script define esa promesa con un resultado nulo y el frontend recurre automáticamente a las implementaciones JavaScript equivalentes, manteniendo la compatibilidad.

## Guía de despliegue

### Integridad de recursos estáticos (SRI)

Los archivos JavaScript críticos que se sirven desde `/public` se publican con [Subresource Integrity (SRI)](https://developer.mozilla.org/es/docs/Web/Security/Subresource_Integrity). Siempre que modifiques `public/repair.js`, `public/protect.js`, `public/js/dolarhoy.bundle.js`, `public/preload.js`, `public/init.js`, `public/router.js` o `public/js/rate-ticker.js` debes recalcular el hash antes de desplegar:

```bash
openssl dgst -sha512 -binary public/repair.js | openssl base64 -A
openssl dgst -sha512 -binary public/protect.js | openssl base64 -A
openssl dgst -sha512 -binary public/js/dolarhoy.bundle.js | openssl base64 -A
openssl dgst -sha512 -binary public/preload.js | openssl base64 -A
openssl dgst -sha512 -binary public/init.js | openssl base64 -A
openssl dgst -sha512 -binary public/router.js | openssl base64 -A
openssl dgst -sha512 -binary public/js/rate-ticker.js | openssl base64 -A
```

Copia cada resultado con el prefijo `sha512-` dentro del atributo `integrity` correspondiente en `public/index.html` o `public/dolarhoy.html`. Recuerda mantener también `crossorigin="anonymous"` en esos `<script>`.

### Scripts de terceros

La página principal carga `https://tally.so/widgets/embed.js` para mostrar formularios embebidos dinámicos. Ese script se mantiene como excepción al SRI porque lo controla un tercero y puede cambiar sin previo aviso; autoalojarlo rompería las actualizaciones que aplica Tally y complicaría su mantenimiento. Documenta esta excepción en cualquier auditoría y monitoriza los cambios de Tally según las políticas del servicio.

### Verificación local

Antes de desplegar puedes verificar rápidamente que los archivos firmados se sirvan correctamente levantando un servidor estático sobre `public`:

```bash
python -m http.server 8000 --directory public
# En otra terminal
curl -I http://127.0.0.1:8000/repair.js
curl -I http://127.0.0.1:8000/init.js
curl -I http://127.0.0.1:8000/js/dolarhoy.bundle.js
```

Si las respuestas son `200 OK` los archivos están accesibles y listos para que el navegador valide los hashes en tiempo de ejecución.

## Uso del backend

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   Esto ejecuta `vercel dev`, que sirve las páginas estáticas del directorio `public`
   y expone los endpoints en `/api`.
   Si accedes a una ruta con terminación `.html` serás redirigido
   automáticamente a la versión sin extensión, por ejemplo

### Variables de entorno

El backend solo se habilita si defines las siguientes variables. Si no necesitas
el backend puedes omitirlas y el proyecto funcionará como un sitio estático:

- `ADMIN_USERNAME` – nombre de usuario permitido para acceder al panel de administración.
- `ADMIN_PASSWORD` – contraseña correspondiente a ese usuario.
- `GEMINI_API_KEY` – clave para consumir la API de Gemini utilizada por el chatbot.
- `OPENROUTER_API_KEY` – clave usada para autenticar el reenvío de registros hacia el flujo de OpenRouter.
- `OPENROUTER_REGISTRATION_URL` – URL del flujo o endpoint de OpenRouter que almacenará los registros (puedes usar `REGISTRO_FORWARD_URL` como alias).

#### Credenciales de PayPal

Los endpoints `api/paypal` leen las credenciales de PayPal desde el entorno:

- `PAYPAL_CLIENT_ID` – identificador del cliente REST.
- `PAYPAL_CLIENT_SECRET` – secreto asociado al cliente.
- `PAYPAL_ENV` – entorno a utilizar. Debes declararla explícitamente con `sandbox` para pruebas o `production` para cobros reales (también se acepta el alias `live`).
- `PAYPAL_TOKEN_ENDPOINT_ENABLED` – opcional. Define `true` solo en entornos de diagnóstico para exponer `GET /api/paypal/token`. En producción debe omitirse o establecerse en cualquier valor distinto de `true`.

Valores recomendados:

- **Sandbox**: crea las credenciales en [PayPal Developer](https://developer.paypal.com/) y define `PAYPAL_ENV=sandbox` con el `client id` y `client secret` del entorno de pruebas.
- **Producción**: genera un cliente en el panel de producción, usa sus credenciales reales y establece `PAYPAL_ENV=production`.

En local puedes declararlas en `.env` (a partir de `.env.example`). En Vercel, añade `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_ENV` en **Project Settings → Environment Variables** para cada entorno (Development, Preview y Production) y vuelve a desplegar. Si omites `PAYPAL_ENV` durante el desarrollo el cliente asumirá `sandbox` por seguridad, pero en producción se considera obligatorio y el backend devolverá un error.

Para configurarlas localmente crea un archivo `.env` en la raíz del proyecto (puedes
tomar como referencia `.env.example`) y define ahí las variables necesarias:

```bash
GEMINI_API_KEY=tu_clave
```

El archivo `.env` está incluido en `.gitignore` para evitar subir la clave al repositorio.
En Vercel, añade `GEMINI_API_KEY` desde la sección **Environment Variables** del panel
del proyecto.

## Generador de audio TTS con Gemini

La página `public/audio/index.html` es una SPA que genera locuciones MP3 con el modelo
**Gemini 2.5 Pro (preview)** y la voz Zephyr. Todo sucede en el navegador; no necesitas
un backend adicional para probarla.

### Requisitos

1. Instala las dependencias si aún no lo has hecho:

   ```bash
   npm install
   ```

2. Declara `GEMINI_API_KEY` en `.env` o como variable de entorno. El script
   `npm run generate:env-config` (ejecutado automáticamente en `predev`, `prebuild`
   y `prestart`) creará `public/env-config.js` con los valores disponibles.
   Si la clave falta, la aplicación mostrará un error al intentar generar audio.

   ```bash
   # .env
   GEMINI_API_KEY=tu_clave_de_google_ai_studio
   ```

3. Si trabajas sin credenciales de PayPal, el script generará `public/env-config.js`
   igualmente dejando el `PAYPAL_CLIENT_ID` vacío.

### Ejecución local

- Inicia el entorno con `npm run dev` y abre `http://localhost:3000/audio` en tu
  navegador.
- Para recompilar el bundle cuando cambies `src/audio/app.js` ejecuta:

  ```bash
  npm run build:audio
  ```

  Esto genera `public/audio/app.js` listo para servir en producción.

### Despliegue

- Define `GEMINI_API_KEY` en los entornos de Vercel (Development/Preview/Production) u
  otro proveedor equivalente.
- Añade `npm run build:audio` a tu pipeline de build para garantizar que
  `public/audio/app.js` se actualice con cada despliegue.
- Recuerda que `public/env-config.js` se genera en el build y no debe versionarse con
  claves reales; está incluido en `.gitignore`.

### Solución de problemas comunes

- **La página muestra “Falta la clave GEMINI_API_KEY”**: el bundle se construyó sin la
  variable de entorno. Define `GEMINI_API_KEY` en Vercel y vuelve a desplegar para que
  `scripts/generate-env-config.js` regenere `public/env-config.js` con la clave.
- **`public/env-config.js` no existe en producción**: asegúrate de que tu comando de
  build ejecute `npm run build:audio` o cualquier script que dependa de los hooks
  `prebuild`/`prestart`. Estos hooks invocan `npm run generate:env-config`, que crea el
  archivo a partir de `public/env-config.example.js` usando los valores presentes en las
  variables de entorno.

#### Persistencia de registros de HomeVisa

El endpoint `/api/registro` reenvía cada alta al flujo definido en `OPENROUTER_REGISTRATION_URL`
utilizando la clave `OPENROUTER_API_KEY`. Después, guarda una copia normalizada en
`data/registrations.json` (o en la ruta que definas con `REGISTRO_STORAGE_DIR`). De forma
opcional puedes ajustar:

- `REGISTRO_STORAGE_DIR` – ruta absoluta donde guardar el archivo persistente.
- `REGISTRO_STORAGE_FALLBACK_DIR` – ubicación alternativa para entornos de solo lectura (por ejemplo `/tmp`).
- `REGISTRO_MAX_RECORDS` – límite máximo de registros conservados en disco (por defecto 200).
- `OPENROUTER_REFERRER` / `OPENROUTER_TITLE` – encabezados adicionales aceptados por OpenRouter.

Si alguno de los directorios es de solo lectura el backend intentará escribir en el fallback.
Recuerda que ubicaciones efímeras como `/tmp` se vacían en cada despliegue o reinicio.

### Archivo `public/env-config.js`

El frontend espera encontrar `public/env-config.js` con el identificador de cliente de
PayPal. Para mantener el repositorio libre de secretos, el archivo real no se versiona
(`public/env-config.js` y `public/env-config.local.js` están listados en `.gitignore`).

- **Entorno local**: copia el ejemplo y reemplaza el marcador por tu `client id`.

  ```bash
  cp public/env-config.example.js public/env-config.js
  # Edita el archivo y sustituye TU_CLIENT_ID_DE_PAYPAL por tu valor real
  ```

  Para mantenerlo sincronizado con tu `.env`, puedes generar el archivo automáticamente si ya definiste `PAYPAL_CLIENT_ID`:

  ```bash
  source .env
  cp public/env-config.example.js public/env-config.js
  sed -i "s/TU_CLIENT_ID_DE_PAYPAL/${PAYPAL_CLIENT_ID}/" public/env-config.js
  ```

  Si prefieres mantener el archivo general con credenciales de sandbox, puedes crear
  `public/env-config.local.js` para pruebas puntuales; cualquier valor definido ahí
  sobreescribe al de `env-config.js` durante el desarrollo.

- **Despliegue en Vercel**: define la variable `PAYPAL_CLIENT_ID` en la sección
  **Environment Variables** y añade un paso previo al build (por ejemplo, en `package.json`
  dentro del script `vercel-build`) que genere el archivo a partir del ejemplo:

  ```bash
  cp public/env-config.example.js public/env-config.js
  sed -i "s/TU_CLIENT_ID_DE_PAYPAL/${PAYPAL_CLIENT_ID}/" public/env-config.js
  ```

  Cualquier enfoque equivalente (un pequeño script en Node.js, `envsubst`, etc.) es válido
  siempre que cree `public/env-config.js` antes de que Vercel sirva los archivos estáticos.

### Endpoints principales

Cuando el proyecto se despliega en Vercel los servicios quedan disponibles bajo
la ruta `/api`. Los principales endpoints son:

- `POST /api/admin/login` – recibe `username` y `password` y devuelve un token de sesión.
- `GET /api/admin/users` – requiere el token en el encabezado `Authorization` y lista los usuarios conectados con su nombre y saldo.
- `POST /api/admin/users` – crea un nuevo usuario (requiere token).
- `GET /api/admin/connected` – muestra cuántos usuarios tienen una sesión
  activa y sus detalles (requiere token).
- `PUT /api/admin/users/:id/password` – permite actualizar la clave de un usuario (requiere token).
- `GET /api/admin/users/:id` – devuelve todos los detalles de un usuario específico (requiere token).
- `DELETE /api/admin/users/:id` – elimina un usuario de la lista (requiere token).
- `POST /api/login` – inicia sesión de usuario y registra la hora de conexión.
- `POST /api/logout` – cierra la sesión del usuario especificado.
- `GET /api/paypal/token` – devuelve un token de acceso temporal de PayPal para diagnósticos. **No** debe exponerse en producción; el endpoint solo responde si `NODE_ENV` no es `production` o si defines la variable `PAYPAL_TOKEN_ENDPOINT_ENABLED=true` de forma explícita.

> [!CAUTION]
> El endpoint `GET /api/paypal/token` se incluye únicamente para diagnosticar problemas con las credenciales en entornos de pruebas.
> Antes de desplegar en producción asegúrate de eliminar la variable `PAYPAL_TOKEN_ENDPOINT_ENABLED` o asignarle un valor diferente de `true`.
> Como medida adicional, elimina el archivo `api/paypal/token.js` o renombra la ruta si no es necesario conservarlo.

Estos datos se almacenan en memoria para fines de demostración.

### Registro de capturas de PayPal

El endpoint `POST /api/paypal/capture-order` registra cada captura de pago en
`data/paypal-captures.json`. En entornos de solo lectura como Vercel la
aplicación detecta los errores `EACCES`/`EROFS`, redirige el almacenamiento a
`/tmp/paypal-captures.json` y emite una advertencia en los logs. Ten en cuenta
que `/tmp` es efímero: la información se pierde en cada nuevo despliegue o
reinicio del servidor. Si necesitas persistencia duradera debes conectar un
almacenamiento externo (por ejemplo, una base de datos o un bucket).

## Frontend de administración

Se incluye una interfaz sencilla para manejar el backend desde el navegador. Para
utilizarla basta con abrir `admin` una vez que el servidor esté en ejecución.
Desde esta página podrás:

- Iniciar sesión como administrador a través de `POST /api/admin/login`.
- Consultar los usuarios conectados mediante `GET /api/admin/users`.
- Crear nuevos usuarios con `POST /api/admin/users`.
- Actualizar la clave de cualquier usuario usando `PUT /api/admin/users/:id/password`.
- Ver los detalles de un usuario con `GET /api/admin/users/:id`.
- Eliminar usuarios mediante `DELETE /api/admin/users/:id`.

De esta forma puedes probar todas las funcionalidades del backend sin utilizar
herramientas externas.

## Ajustes de cuenta

Se agregó la página `ajustes` que presenta un panel completo para gestionar la cuenta del usuario, incluyendo balances, límites, seguridad y bancos registrados.

### Monto de validación

En este panel puedes ajustar el monto que se descontará temporalmente al validar tu cuenta. Desde la app navega a **Ajustes → Gestión de cuenta → Monto de validación** y elige una de las siguientes opciones:

- **Reducir 5 USD** – aplica una comisión del 0,5 % en tu primera transacción.
- **Reducir 10 USD** – aplica una comisión del 1 % y solo puede activarse una vez durante 4 horas.

Ten en cuenta que la reducción de 10 USD es única y temporal; después de usarla o expirar el plazo, el monto vuelve a su valor estándar.

## Enlaces sin extensión

El proyecto está configurado en Vercel con `cleanUrls` y una regla de
`rewrites` para que cada página funcione tanto con la terminación `.html` como
sin ella. Los enlaces internos apuntan a rutas como `recarga`, `ajustes` o
`transferencia`, pero acceder a `homevisa.html` o `recarga` mostrará el mismo
contenido. Si navegas de manera local puedes abrir los archivos con su
extensión `.html` o sin ella si cuentas con un servidor que maneje estas
rewrites.

## PWA y Safari

La aplicación incluye un `manifest.json` y un `service worker` para habilitar funcionalidades PWA. Safari requiere que el manifiesto se sirva con `application/manifest+json` y que el `service worker` esté en una ruta acorde a su *scope*.

Ejemplo de `manifest.json` válido:

```json
{
  "name": "Remeex VISA",
  "short_name": "Remeex",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/visablu192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/visablu512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Incluye en la cabecera de tus páginas las metatags `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title` y los enlaces `apple-touch-icon` y `apple-touch-startup-image` para una correcta instalación en iOS.

## Resultados de pruebas

Se añadieron pruebas automatizadas para validar los montos de verificación y las comisiones aplicadas. Puedes ejecutarlas con:

```bash
npm test
```

Al ejecutar este comando todas las pruebas pasan correctamente.
