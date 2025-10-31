# 🔐 INSTRUCCIONES COMPLETAS: Configurar Google OAuth en Supabase

## 📋 RESUMEN

Este documento te guía paso a paso para habilitar la autenticación con Google en tu proyecto REMEEX VISA usando Supabase.

**Tiempo estimado:** 15-20 minutos
**Requisitos previos:**
- Cuenta de Google (Gmail)
- Proyecto de Supabase ya creado
- Acceso a Google Cloud Console

---

## 🎯 PARTE 1: CONFIGURAR GOOGLE CLOUD CONSOLE

### **PASO 1.1: Acceder a Google Cloud Console**

1. Abre tu navegador
2. Ve a: https://console.cloud.google.com
3. Inicia sesión con tu cuenta de Google
4. Si es tu primera vez, acepta los términos de servicio

### **PASO 2.1: Crear un Proyecto Nuevo (o seleccionar existente)**

1. En la esquina superior izquierda, haz clic en el selector de proyectos
2. Verás una ventana emergente con tus proyectos
3. Haz clic en **"NEW PROJECT"** (Proyecto Nuevo) en la esquina superior derecha
4. Llena los datos:
   - **Project name:** `REMEEX-VISA-Auth` (o el nombre que prefieras)
   - **Organization:** Dejar en blanco (a menos que tengas una organización)
   - **Location:** Dejar en blanco
5. Haz clic en **"CREATE"**
6. Espera 10-15 segundos mientras se crea el proyecto
7. Una vez creado, asegúrate de que esté seleccionado (verás el nombre en la esquina superior)

### **PASO 3.1: Habilitar Google+ API**

1. En el menú lateral izquierdo, busca **"APIs & Services"** (APIs y Servicios)
2. Haz clic en **"Library"** (Biblioteca)
3. En el buscador, escribe: **"Google+ API"**
4. Haz clic en **"Google+ API"** en los resultados
5. Haz clic en el botón azul **"ENABLE"** (Habilitar)
6. Espera unos segundos mientras se habilita

### **PASO 4.1: Configurar la Pantalla de Consentimiento (OAuth Consent Screen)**

1. En el menú lateral izquierdo, haz clic en **"OAuth consent screen"**
2. Selecciona **"External"** (usuarios de cualquier cuenta Google pueden usar la app)
3. Haz clic en **"CREATE"**
4. Llena el formulario:

**App information:**
- **App name:** `REMEEX VISA`
- **User support email:** Tu email (ejemplo@gmail.com)
- **App logo:** (opcional) Puedes subir el logo de REMEEX si tienes uno

**App domain:**
- **Application home page:** `https://tu-dominio-vercel.vercel.app` (o tu dominio)
- **Application privacy policy link:** (opcional por ahora)
- **Application terms of service link:** (opcional por ahora)

**Authorized domains:**
- Haz clic en **"+ ADD DOMAIN"**
- Agrega tu dominio de Vercel (ejemplo: `tu-proyecto.vercel.app`)
- **NO incluyas** `https://` ni rutas, solo el dominio

**Developer contact information:**
- **Email addresses:** Tu email

5. Haz clic en **"SAVE AND CONTINUE"**

**Scopes (Alcances):**
6. Haz clic en **"ADD OR REMOVE SCOPES"**
7. Busca y selecciona:
   - `.../auth/userinfo.email` (Ver tu dirección de correo)
   - `.../auth/userinfo.profile` (Ver tu información personal)
8. Haz clic en **"UPDATE"**
9. Haz clic en **"SAVE AND CONTINUE"**

**Test users:**
10. (Opcional) Agrega tu email como usuario de prueba
11. Haz clic en **"SAVE AND CONTINUE"**

**Summary:**
12. Revisa la información
13. Haz clic en **"BACK TO DASHBOARD"**

### **PASO 5.1: Crear Credenciales OAuth (Client ID y Client Secret)**

1. En el menú lateral, haz clic en **"Credentials"** (Credenciales)
2. En la parte superior, haz clic en **"+ CREATE CREDENTIALS"**
3. Selecciona **"OAuth client ID"**

**Application type:**
4. Selecciona **"Web application"**

**Name:**
5. Escribe: `REMEEX VISA Web Client`

**Authorized JavaScript origins:**
6. Haz clic en **"+ ADD URI"**
7. Agrega: `https://tu-dominio-vercel.vercel.app` (tu dominio de producción)
8. Haz clic en **"+ ADD URI"** nuevamente
9. Agrega: `http://localhost:3000` (para desarrollo local)

**Authorized redirect URIs:**
10. Haz clic en **"+ ADD URI"**
11. **IMPORTANTE:** Necesitas obtener la URL de callback de Supabase primero

**⚠️ PAUSA AQUÍ - Ve a la PARTE 2 para obtener la URL de callback de Supabase**

---

## 🎯 PARTE 2: OBTENER URL DE CALLBACK DE SUPABASE

### **PASO 1.2: Acceder a Supabase**

1. Abre una nueva pestaña en tu navegador
2. Ve a: https://supabase.com
3. Inicia sesión en tu cuenta
4. Selecciona tu proyecto **REMEEX VISA**

### **PASO 2.2: Acceder a Authentication Settings**

1. En el menú lateral izquierdo, haz clic en **"Authentication"** (🔐)
2. Haz clic en **"Providers"** (Proveedores)
3. Busca **"Google"** en la lista
4. Haz clic en el botón de expansión (▼) junto a "Google"

### **PASO 3.2: Copiar la URL de Callback**

5. Verás un campo llamado **"Callback URL (for OAuth)"**
6. Copia esa URL completa. Se verá algo así:
   ```
   https://tuproyecto.supabase.co/auth/v1/callback
   ```
7. **Guarda esta URL en un lugar seguro** (bloc de notas, por ejemplo)

**⚠️ REGRESA A LA PARTE 1, PASO 5.1 para continuar**

---

## 🎯 PARTE 3: COMPLETAR CONFIGURACIÓN EN GOOGLE CLOUD

### **PASO 6.1: Agregar Redirect URI (continuación)**

1. Regresa a la pestaña de Google Cloud Console
2. En **"Authorized redirect URIs"**, haz clic en **"+ ADD URI"**
3. Pega la URL de callback de Supabase que copiaste:
   ```
   https://tuproyecto.supabase.co/auth/v1/callback
   ```
4. Haz clic en **"CREATE"**

### **PASO 7.1: Copiar Client ID y Client Secret**

5. Verás una ventana emergente con tus credenciales:
   - **Client ID:** Una cadena larga como `123456789-abc...xyz.apps.googleusercontent.com`
   - **Client secret:** Una cadena más corta

6. **COPIA ambos valores** en un bloc de notas seguro
7. Haz clic en **"OK"**

**⚠️ IMPORTANTE:**
- **NO compartas** estas credenciales públicamente
- **NO las subas** a GitHub sin variables de entorno
- Guárdalas en un lugar seguro

---

## 🎯 PARTE 4: CONFIGURAR SUPABASE CON LAS CREDENCIALES

### **PASO 1.3: Volver a Supabase Authentication**

1. Regresa a la pestaña de Supabase
2. Deberías estar en **Authentication → Providers → Google**
3. Si no, navega hasta ahí nuevamente

### **PASO 2.3: Habilitar Google Provider**

1. Activa el toggle **"Enable Sign in with Google"**
2. Verás que se expande el formulario

### **PASO 3.3: Ingresar Credenciales**

3. En el campo **"Google Client ID"**, pega el Client ID que copiaste
4. En el campo **"Google Client Secret"**, pega el Client Secret que copiaste

### **PASO 4.3: Configurar Opciones Adicionales (opcional)**

5. **Skip nonce checks:** Déjalo desactivado (más seguro)
6. **Authorize redirect URLs:** (opcional) Agrega URLs adicionales si las necesitas

### **PASO 5.3: Guardar Configuración**

7. Haz clic en el botón **"Save"** (Guardar) en la parte inferior
8. Verás un mensaje de éxito: "Successfully updated settings"

---

## 🎯 PARTE 5: EJECUTAR SQL EN SUPABASE

### **PASO 1.4: Abrir SQL Editor**

1. En Supabase, en el menú lateral, haz clic en **"SQL Editor"** (</>)
2. Verás el editor de código SQL

### **PASO 2.4: Ejecutar SUPABASE_USER_AUTH_V2.sql**

3. Abre el archivo `SUPABASE_USER_AUTH_V2.sql` de tu proyecto
4. Selecciona **TODO el contenido** (Ctrl+A / Cmd+A)
5. Cópialo (Ctrl+C / Cmd+C)
6. Pégalo en el SQL Editor de Supabase
7. Haz clic en el botón **"RUN"** ▶️ en la esquina inferior derecha
8. Espera unos segundos
9. Deberías ver: **"Success. No rows returned"** ✅

### **PASO 3.4: Verificar que se crearon las funciones**

10. En el menú lateral, haz clic en **"Database"** → **"Functions"**
11. Verifica que existan estas funciones:
    - ✅ `authenticate_user`
    - ✅ `check_google_user`
    - ✅ `authenticate_user_google`
    - ✅ `verify_code_20`
    - ✅ `get_user_data`
    - ✅ `log_device_activity`

---

## 🎯 PARTE 6: PROBAR EL SISTEMA

### **PASO 1.5: Desplegar a Vercel (si aún no lo has hecho)**

1. Abre tu terminal
2. Navega a tu proyecto:
   ```bash
   cd /home/user/triava201
   ```
3. Asegúrate de tener los cambios committeados (lo haremos después)
4. Haz push a tu repositorio
5. Vercel desplegará automáticamente

### **PASO 2.5: Probar Login con Google**

1. Abre tu aplicación en producción: `https://tu-proyecto.vercel.app/login.html`
2. Verás el botón **"Continuar con Google"**
3. Haz clic en el botón
4. Deberías ser redirigido a la pantalla de Google
5. Selecciona tu cuenta de Google
6. Acepta los permisos

**Primer Login (usuario nuevo):**
- Serás redirigido a `/google-verify.html`
- Te pedirá el código de 20 dígitos
- Ingresa el código que te enviaron por correo
- Si es correcto, serás redirigido a `/homevisa.html`

**Segundo Login (usuario existente):**
- Serás redirigido directamente a `/homevisa.html`
- Tu sesión se crea automáticamente

---

## 📝 RESUMEN DE ARCHIVOS CREADOS/MODIFICADOS

### **Archivos SQL:**
- ✅ `SUPABASE_USER_AUTH_V2.sql` - Schema con soporte Google Auth

### **Páginas HTML:**
- ✅ `public/login.html` - Modificado con botón de Google
- ✅ `public/google-verify.html` - Nueva página para verificar código

### **JavaScript:**
- ✅ `public/js/user-auth.js` - Agregados métodos de Google OAuth

### **Documentación:**
- ✅ `INSTRUCCIONES_GOOGLE_AUTH.md` - Este documento

---

## 🔧 TROUBLESHOOTING (SOLUCIÓN DE PROBLEMAS)

### **Problema 1: "Error: redirect_uri_mismatch"**

**Causa:** La URL de redirección no está autorizada en Google Cloud Console

**Solución:**
1. Ve a Google Cloud Console → Credentials
2. Haz clic en tu Client ID
3. En "Authorized redirect URIs", verifica que tengas exactamente:
   ```
   https://tuproyecto.supabase.co/auth/v1/callback
   ```
4. Guarda los cambios
5. Espera 5-10 minutos para que se propague
6. Intenta nuevamente

### **Problema 2: "Invalid client ID"**

**Causa:** El Client ID no coincide o está mal copiado

**Solución:**
1. Ve a Google Cloud Console → Credentials
2. Copia nuevamente el Client ID completo
3. Ve a Supabase → Authentication → Providers → Google
4. Pega el Client ID nuevamente
5. Guarda

### **Problema 3: El botón de Google no hace nada**

**Causa:** Supabase Auth no está configurado correctamente

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Si ves "Google provider not enabled":
   - Ve a Supabase → Authentication → Providers
   - Verifica que el toggle de Google esté activado ✅

### **Problema 4: "Usuario no encontrado" después de verificar código**

**Causa:** El usuario no fue creado en la tabla `registrations`

**Solución:**
1. El usuario debe completar el registro normal en `/registro.html`
2. Google Auth solo facilita el login, pero el registro completo con código de 20 dígitos es obligatorio

---

## ✅ CHECKLIST FINAL

Antes de dar por completada la configuración, verifica:

- [ ] ✅ Google Cloud Console:
  - [ ] Proyecto creado
  - [ ] OAuth Consent Screen configurado
  - [ ] Google+ API habilitada
  - [ ] Credenciales OAuth creadas
  - [ ] Redirect URI de Supabase agregada

- [ ] ✅ Supabase:
  - [ ] Google Provider habilitado
  - [ ] Client ID y Secret configurados
  - [ ] SQL `SUPABASE_USER_AUTH_V2.sql` ejecutado
  - [ ] 6 funciones creadas verificadas

- [ ] ✅ Código:
  - [ ] `login.html` tiene botón de Google
  - [ ] `google-verify.html` existe
  - [ ] `user-auth.js` tiene métodos de Google
  - [ ] Cambios committeados a Git
  - [ ] Desplegado en Vercel

- [ ] ✅ Pruebas:
  - [ ] Login con Google funciona
  - [ ] Redirección a verificación funciona
  - [ ] Validación de código 20 dígitos funciona
  - [ ] Login posterior sin código funciona

---

## 📞 SOPORTE

Si tienes problemas que no puedes resolver:

1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs en Supabase → Logs
3. Verifica que todas las URLs sean correctas (sin typos)
4. Contacta al equipo de desarrollo

---

**¡LISTO!** 🎉

Ahora tu sistema tiene autenticación híbrida:
- ✅ Email/Password tradicional
- ✅ Google OAuth
- ✅ Validación obligatoria con código de 20 dígitos
- ✅ Multi-dispositivo
- ✅ Sincronización automática

