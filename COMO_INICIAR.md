# 🚀 CÓMO INICIAR LA APLICACIÓN - Guía Paso a Paso

## 📋 Requisitos Previos (Solo la primera vez)

Antes de empezar, asegúrate de tener instalado:
- **Node.js** (versión 22.x o superior)
- **npm** (viene con Node.js)

---

## ⚡ INICIO RÁPIDO

### Cada vez que quieras iniciar la aplicación:

1. **Abre tu terminal o línea de comandos**
   - Windows: `cmd`, `PowerShell` o `Git Bash`
   - Mac/Linux: Terminal

2. **Ve a la carpeta del proyecto**
   ```bash
   cd /ruta/a/triava201
   ```

3. **Inicia el servidor**
   ```bash
   npm run dev:5000
   ```

4. **¡Listo!** Verás este mensaje:
   ```
   🚀 ======================================
   ✅ Servidor iniciado en puerto 5000

   📊 Panel de Administración:
      http://localhost:5000/admin-registros.html

   📝 API de Registro:
      http://localhost:5000/api/registro
   ======================================
   ```

---

## 🌐 Accede a las Páginas

### 1. **Página de Registro (Frontend)**
```
http://localhost:5000/registro.html
```
Aquí los usuarios se registran normalmente.

### 2. **Panel de Administración (Ver registros)**
```
http://localhost:5000/admin-registros.html
```
Aquí ves TODOS los registros de usuarios.

---

## 📊 ¿Cómo funciona?

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO DE DATOS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuario llena el formulario en registro.html           │
│                        ↓                                    │
│  2. JavaScript hace POST a /api/registro                   │
│                        ↓                                    │
│  3. Servidor guarda en data/registrations.json (tu PC)     │
│                        ↓                                    │
│  4. Admin-registros.html lee los datos y los muestra       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📁 Los datos se guardan aquí:
```
triava201/data/registrations.json
```
Este archivo está en TU computadora local, no en internet.

---

## 🎯 Pasos Detallados Para Nuevos Usuarios

### Primera vez (Instalación)

1. **Abrir terminal**
2. **Navegar al proyecto**
   ```bash
   cd /ruta/a/triava201
   ```

3. **Instalar dependencias** (solo una vez)
   ```bash
   npm install
   ```
   Esto instalará todas las librerías necesarias.

4. **Verificar que existe el archivo .env**
   ```bash
   ls -la .env
   ```
   Si no existe, créalo con este contenido mínimo:
   ```env
   REGISTRO_MAX_RECORDS=200
   OPENROUTER_API_KEY=sk-test-key
   OPENROUTER_REGISTRATION_URL=https://example.com/api
   ```

### Cada vez que inicies

1. **Abrir terminal**
2. **Ir a la carpeta**
   ```bash
   cd /ruta/a/triava201
   ```

3. **Iniciar servidor**
   ```bash
   npm run dev:5000
   ```

4. **Abrir navegador en:**
   - Registro: http://localhost:5000/registro.html
   - Admin: http://localhost:5000/admin-registros.html

5. **Para detener el servidor**
   Presiona `Ctrl + C` en la terminal

---

## 🎨 Opciones de Puerto

Si el puerto 5000 está ocupado, usa otro:

### Puerto 8080
```bash
npm run dev:8080
```
Abrir: http://localhost:8080/admin-registros.html

### Puerto personalizado
```bash
PORT=9000 npm run dev
```
Abrir: http://localhost:9000/admin-registros.html

---

## 📝 Ejemplo de Uso Completo

### Paso 1: Iniciar servidor
```bash
cd /ruta/a/triava201
npm run dev:5000
```

### Paso 2: Registrar un usuario
1. Abre: http://localhost:5000/registro.html
2. Llena el formulario con datos reales
3. Haz clic en "Registrar"

### Paso 3: Ver los registros
1. Abre: http://localhost:5000/admin-registros.html
2. Verás el nuevo usuario en la tabla

### Paso 4: Verificar el archivo local
```bash
cat data/registrations.json
```
Verás el JSON con los datos guardados.

---

## 🔒 Datos Locales

### ¿Dónde se guardan los datos?
```
triava201/data/registrations.json
```

### ¿Están en internet?
❌ NO. Los datos están solo en tu PC.

### ¿Cómo hacer backup?
Simplemente copia el archivo:
```bash
cp data/registrations.json data/registrations_backup_$(date +%Y%m%d).json
```

### ¿Cuántos registros se guardan?
- Por defecto: 200 registros
- Puedes cambiar esto en `.env`: `REGISTRO_MAX_RECORDS=500`

---

## ❓ Solución de Problemas

### Error: "Puerto ya en uso"
**Solución**: Usa otro puerto
```bash
npm run dev:8080
```

### Error: "npm: command not found"
**Solución**: Instala Node.js desde https://nodejs.org/

### Error: "Cannot find module"
**Solución**: Instala las dependencias
```bash
npm install
```

### No veo los registros en el panel
**Solución**:
1. Verifica que el servidor esté corriendo
2. Abre las DevTools del navegador (F12)
3. Ve a Console y Network para ver errores
4. Verifica que `data/registrations.json` tenga datos

### Los datos no se guardan
**Solución**:
1. Verifica que el archivo `.env` exista
2. Verifica permisos del directorio `data/`
3. Revisa los logs en la terminal donde corre el servidor

---

## 🚀 Scripts Disponibles

```bash
npm run dev:5000    # Inicia en puerto 5000
npm run dev:8080    # Inicia en puerto 8080
npm run dev         # Inicia en puerto por defecto (3000)
npm run start       # Alias de dev
```

---

## 📊 Funciones del Panel de Admin

1. **Ver todos los registros** - Tabla completa con todos los datos
2. **Buscar** - Busca por email, nombre, teléfono, país, etc.
3. **Paginar** - Navega entre páginas de resultados
4. **Exportar CSV** - Descarga todos los registros a Excel
5. **Auto-refresh** - Se actualiza automáticamente cada 30 segundos

---

## 🎯 Resumen Ultra-Rápido

```bash
# 1. Ir al proyecto
cd triava201

# 2. Iniciar servidor
npm run dev:5000

# 3. Abrir navegador
# Registro: http://localhost:5000/registro.html
# Admin: http://localhost:5000/admin-registros.html

# 4. Detener (cuando termines)
Ctrl + C
```

---

## 📞 ¿Necesitas ayuda?

1. Verifica los logs en la terminal
2. Abre las DevTools del navegador (F12) para ver errores
3. Revisa que `data/registrations.json` exista
4. Asegúrate de que Node.js esté instalado: `node --version`

---

¡Listo! Ahora ya sabes cómo iniciar y usar la aplicación. 🎉
