# 🚀 GUÍA PASO A PASO - Configurar Supabase

## 📝 PASO 1: Acceder a Supabase

1. Abre tu navegador
2. Ve a: **https://supabase.com**
3. Click en **"Sign In"** (arriba a la derecha)
4. Ingresa:
   - Email: cuchinelyguillermo@gmail.com
   - Contraseña: Tu contraseña
5. Click en **"Sign In"**

---

## 📝 PASO 2: Crear Nuevo Proyecto

1. Una vez dentro, verás el dashboard
2. Click en el botón verde **"New Project"** o **"+ New Project"**
3. Te pedirá seleccionar una organización:
   - Si no tienes, click en **"Create a new organization"**
   - Nombre de la organización: **"HomeVisa"** (o el que prefieras)
   - Click en **"Create organization"**

---

## 📝 PASO 3: Configurar el Proyecto

Ahora llena los datos del proyecto:

### **Name** (Nombre del proyecto):
```
homevisa-registros
```

### **Database Password** (Contraseña de la base de datos):
```
Caracas1215**
```
⚠️ **IMPORTANTE**: Guarda esta contraseña, la necesitarás después

### **Region** (Región):
Selecciona la más cercana a tus usuarios:
- **South America (São Paulo)** - Si tus usuarios están en Latinoamérica
- **East US (North Virginia)** - Si están en USA
- **West Europe (Ireland)** - Si están en Europa

### **Pricing Plan**:
- Selecciona: **"Free"** ✅ (es gratis para siempre)

### Luego click en:
```
"Create new project"
```

⏳ **Espera 2-3 minutos** mientras se crea el proyecto...

---

## 📝 PASO 4: Copiar las Credenciales

Una vez creado el proyecto:

1. En el menú izquierdo, click en el ícono de **"Settings"** (⚙️)
2. En el submenú, click en **"API"**
3. Verás dos cosas importantes:

### 🔑 **Project URL**
Se verá algo así:
```
https://abcdefghijklmnop.supabase.co
```
📋 **COPIA ESTE URL COMPLETO**

### 🔑 **anon/public key**
Busca la sección que dice **"Project API keys"**
Copia el key que dice **"anon"** o **"public"**
Se verá algo así:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQzNTIwMCwiZXhwIjoxOTMxOTk3MjAwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```
📋 **COPIA ESTE KEY COMPLETO**

---

## 📝 PASO 5: Crear la Tabla de Registros

1. En el menú izquierdo, click en **"SQL Editor"** (ícono de </>)
2. Click en **"+ New query"**
3. Pega el siguiente código SQL:

```sql
-- Crear tabla de registros
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  preferred_name TEXT,
  nickname TEXT,
  country TEXT,
  state TEXT,
  gender TEXT,
  birth_day TEXT,
  birth_month TEXT,
  birth_year TEXT,
  document_type TEXT,
  document_number TEXT,
  phone_country_code TEXT,
  phone_prefix TEXT,
  phone_number TEXT,
  full_phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  presence JSONB,
  forwarded_at TIMESTAMPTZ,
  external_reference TEXT
);

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX idx_registrations_country ON registrations(country);

-- Habilitar Row Level Security (seguridad)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (solo lectura)
CREATE POLICY "Enable read access for all users" ON registrations
  FOR SELECT USING (true);

-- Política para permitir inserción pública
CREATE POLICY "Enable insert access for all users" ON registrations
  FOR INSERT WITH CHECK (true);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click en **"Run"** (botón verde abajo a la derecha)
5. Deberías ver: ✅ **"Success. No rows returned"**

---

## ✅ PASO 6: Dame las Credenciales

Ahora **pégame aquí**:

1. **SUPABASE_URL**: (la URL que copiaste, ej: https://xxxxx.supabase.co)
2. **SUPABASE_ANON_KEY**: (el key largo que copiaste)

**Ejemplo de cómo enviármelas:**
```
SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Después de que me des las credenciales:

Yo configuraré automáticamente:
- ✅ El código para guardar registros en Supabase
- ✅ El código para leer registros desde Supabase
- ✅ El panel admin para mostrar los datos
- ✅ Variables de entorno en el proyecto
- ✅ Todo el sistema completo

**Tiempo estimado de configuración:** 5-10 minutos

---

## ❓ ¿Necesitas ayuda?

Si tienes algún problema en cualquier paso, dime en qué paso estás y te ayudo específicamente con ese paso.

---

¡Empecemos! 🚀
