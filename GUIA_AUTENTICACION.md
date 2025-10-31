# 🔐 Sistema de Autenticación de Administrador

## ✅ ¿Qué se agregó?

### 1. **Página de Login**
- Ruta: `/admin-login.html`
- Diseño moderno y seguro
- Validación de credenciales

### 2. **Panel Admin Protegido**
- Ruta: `/admin-registros.html`
- Solo accesible con login
- Botón de "Cerrar Sesión"
- Redirige a login automáticamente si no estás autenticado

### 3. **APIs de Autenticación**
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar sesión
- `POST /api/auth/logout` - Cerrar sesión

---

## 🌐 CÓMO FUNCIONA

```
Usuario intenta acceder a /admin-registros.html
        ↓
Sistema verifica si hay sesión activa
        ↓
Si NO hay sesión → Redirige a /admin-login.html
        ↓
Usuario ingresa credenciales
        ↓
Sistema verifica usuario y contraseña
        ↓
Si son correctas → Crea sesión segura (cookie)
        ↓
Redirige a /admin-registros.html
        ↓
Usuario ve todos los registros
```

---

## 🔑 CREDENCIALES

### Para Desarrollo Local:

Edita el archivo `.env`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Caracas1215**
```

### Para Producción (Vercel):

Configurar en Vercel → Settings → Environment Variables:

```
ADMIN_USERNAME = admin
ADMIN_PASSWORD = Caracas1215**
```

⚠️ **Cambia la contraseña por una más segura en producción**

---

## 📝 USO

### 1. Iniciar servidor:
```bash
npm run dev:5000
```

### 2. Abrir login:
```
http://localhost:5000/admin-login.html
```

### 3. Ingresar credenciales:
- **Usuario**: `admin`
- **Contraseña**: `Caracas1215**` (o la que configuraste)

### 4. Click en "Iniciar Sesión"

### 5. Automáticamente redirige al panel admin

### 6. Para cerrar sesión:
Click en el botón "🚪 Cerrar Sesión" (arriba derecha)

---

## 🚀 EN PRODUCCIÓN (visa.remeexvisa.com)

### Paso 1: Configurar Variables en Vercel

1. Ve a https://vercel.com
2. Tu proyecto → Settings → Environment Variables
3. Agregar:

```
ADMIN_USERNAME = admin
ADMIN_PASSWORD = TuContraseñaSegura123!
```

4. Marcar en todos los environments (Production, Preview, Development)

### Paso 2: Hacer Deploy

```bash
git push
```

O desde Vercel Dashboard → Deployments → Redeploy

### Paso 3: Usar

1. Ve a: `https://visa.remeexvisa.com/admin-login.html`
2. Ingresa tus credenciales
3. Click "Iniciar Sesión"
4. Ya puedes ver todos los registros

---

## 🔒 SEGURIDAD

### ✅ Características de Seguridad:

1. **Cookies HTTP-only**
   - No accesibles desde JavaScript
   - Previene XSS attacks

2. **Sesiones con token aleatorio**
   - Token único de 64 caracteres
   - Generado con crypto seguro

3. **HTTPS en producción**
   - Cookies con flag "Secure"
   - Solo en conexiones cifradas

4. **Validación de sesión**
   - Verifica en cada petición
   - Expira automáticamente en 24 horas

5. **Logs de seguridad**
   - Registra intentos de login fallidos
   - Incluye IP y timestamp

### ⚠️ Recomendaciones:

1. **Cambiar contraseña por defecto**
   ```env
   ADMIN_PASSWORD=ContraseñaMuySegura123!@#
   ```

2. **Usar contraseñas fuertes**
   - Mínimo 12 caracteres
   - Mayúsculas, minúsculas, números, símbolos

3. **No compartir credenciales**
   - Mantén el archivo .env privado
   - Nunca subas .env a Git

4. **Monitorear accesos**
   - Revisa logs regularmente
   - Busca intentos sospechosos

---

## 🛡️ PROTECCIÓN ADICIONAL (OPCIONAL)

### Agregar IP Whitelist:

Edita `api/auth/login.js` y agrega:

```javascript
const allowedIPs = ['123.45.67.89', '98.76.54.32'];
const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

if (!allowedIPs.includes(clientIP)) {
  return res.status(403).json({ ok: false, error: 'IP no autorizada' });
}
```

### Limitar intentos de login:

Agregar rate limiting (ej: con `express-rate-limit`)

---

## 📊 URLs IMPORTANTES

### Desarrollo (Localhost):
```
Login:  http://localhost:5000/admin-login.html
Admin:  http://localhost:5000/admin-registros.html
```

### Producción (Vercel):
```
Login:  https://visa.remeexvisa.com/admin-login.html
Admin:  https://visa.remeexvisa.com/admin-registros.html
```

---

## 🔧 TROUBLESHOOTING

### "Usuario o contraseña incorrectos"
- Verifica que ADMIN_USERNAME y ADMIN_PASSWORD estén en .env
- En Vercel, verifica las Environment Variables
- Asegúrate de hacer redeploy después de cambiar variables

### "No session found"
- Las cookies expiran en 24 horas
- Haz login nuevamente
- Verifica que las cookies estén habilitadas en tu navegador

### Panel redirige constantemente a login
- Verifica que el servidor esté corriendo
- Abre DevTools (F12) → Network → Busca errores en /api/auth/verify
- Revisa los logs del servidor

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Variables ADMIN_USERNAME y ADMIN_PASSWORD en .env (local)
- [ ] Variables ADMIN_USERNAME y ADMIN_PASSWORD en Vercel (producción)
- [ ] Cambiar contraseña por defecto por una segura
- [ ] Probar login en localhost
- [ ] Hacer deploy en Vercel
- [ ] Probar login en producción
- [ ] Verificar que panel admin está protegido
- [ ] Botón de cerrar sesión funciona

---

## 💡 TIPS

1. **Guarda tus credenciales en un gestor de contraseñas**
   - LastPass, 1Password, Bitwarden

2. **Usa una contraseña única**
   - No reutilices contraseñas

3. **Cierra sesión cuando termines**
   - Click en "🚪 Cerrar Sesión"

4. **No compartas la URL del panel**
   - Mantén el acceso privado

---

¡Sistema de autenticación configurado y funcionando! 🎉
