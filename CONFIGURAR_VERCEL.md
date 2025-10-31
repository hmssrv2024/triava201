# 🚀 Configurar Variables de Entorno en Vercel

Para que tu sitio **visa.remeexvisa.com** use Supabase en producción, necesitas configurar las variables de entorno en Vercel.

---

## 📝 PASO 1: Acceder a tu Proyecto en Vercel

1. Ve a: **https://vercel.com**
2. Inicia sesión con tu cuenta
3. Encuentra y click en tu proyecto **"triava201"** (o como se llame)

---

## 📝 PASO 2: Ir a Settings

1. Una vez en el proyecto, click en la pestaña **"Settings"** (arriba)
2. En el menú izquierdo, click en **"Environment Variables"**

---

## 📝 PASO 3: Agregar Variables de Supabase

Vas a agregar 2 variables:

### Variable 1: SUPABASE_URL

1. Click en el botón **"Add New"** o **"Add Variable"**
2. Llena los campos:
   - **Key**: `SUPABASE_URL`
   - **Value**: `https://ewdkxszfkqwlkyszodxu.supabase.co`
   - **Environment**: Selecciona **todos** (Production, Preview, Development)
3. Click en **"Save"**

### Variable 2: SUPABASE_ANON_KEY

1. Click en **"Add New"** otra vez
2. Llena los campos:
   - **Key**: `SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGt4c3pma3F3bGt5c3pvZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODM5MzMsImV4cCI6MjA3NzM1OTkzM30.alofRt3MEn5UgSsSMk5zWTF0On1PGVepdME-MOoqk-M`
   - **Environment**: Selecciona **todos** (Production, Preview, Development)
3. Click en **"Save"**

---

## 📝 PASO 4: Hacer un Nuevo Deploy

Para que los cambios surtan efecto, necesitas hacer un nuevo deploy:

### Opción A: Desde la Terminal (Recomendado)

```bash
cd triava201
git add .
git commit -m "Configurar Supabase para almacenamiento permanente"
git push
```

Vercel detectará el push y hará el deploy automáticamente.

### Opción B: Desde el Dashboard de Vercel

1. Ve a la pestaña **"Deployments"**
2. Click en el botón **"Redeploy"** en el deployment más reciente
3. Selecciona **"Use existing Build Cache"** (opcional, más rápido)
4. Click en **"Redeploy"**

⏳ Espera 1-2 minutos mientras se hace el deploy...

---

## ✅ PASO 5: Verificar que Funciona

Una vez que el deploy termine:

1. Ve a tu sitio: **https://visa.remeexvisa.com/registro.html**
2. Llena el formulario con datos de prueba
3. Click en "Registrar"
4. Ve a: **https://visa.remeexvisa.com/admin-registros.html**
5. Deberías ver tu registro en la tabla ✅

También puedes verificar directamente en Supabase:
1. Ve a tu proyecto en Supabase
2. Click en **"Table Editor"** (menú izquierdo)
3. Click en la tabla **"registrations"**
4. Deberías ver tu registro ahí ✅

---

## 🎯 Resultado Final

Después de esto:

✅ Todos los registros se guardan en Supabase (permanentes)
✅ Los datos NUNCA se pierden (ni en deploys)
✅ Puedes ver los registros desde cualquier lugar
✅ Acceso desde visa.remeexvisa.com/admin-registros.html
✅ También puedes ver los datos directo en Supabase Dashboard

---

## 📊 Flujo Completo

```
Usuario llena registro.html
        ↓
POST a visa.remeexvisa.com/api/registro
        ↓
Se guarda en SUPABASE (nube permanente)
        ↓
Tú accedes a visa.remeexvisa.com/admin-registros.html
        ↓
Ves TODOS los registros
```

---

## 🔍 Verificar Variables

Para verificar que las variables están configuradas:

1. En Vercel → tu proyecto → Settings → Environment Variables
2. Deberías ver:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`

---

## ❓ Problemas Comunes

### "No veo los registros en el panel"

1. Verifica que las variables estén en Vercel
2. Verifica que hiciste un nuevo deploy
3. Abre la consola del navegador (F12) y busca errores
4. Verifica que la tabla existe en Supabase

### "Error al guardar"

1. Verifica que las políticas RLS estén configuradas en Supabase
2. Verifica que las variables estén correctamente copiadas
3. Revisa los logs en Vercel (Deployments → click en el deployment → Functions)

---

¡Listo! Ahora tu sistema usa Supabase y los datos son permanentes. 🎉
