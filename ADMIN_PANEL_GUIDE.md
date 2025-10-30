# 📊 Guía del Panel de Administración - Registros

## ¿Qué es esto?

Una página web simple para visualizar todos los datos de los usuarios que se registran en `registro.html`.

## 🚀 Cómo usar

### Opción 1: Ver en Vercel (Producción)

Una vez que hagas deploy en Vercel, puedes acceder a:

```
https://tu-dominio.vercel.app/admin-registros.html
```

### Opción 2: Ver en Localhost (Desarrollo)

1. **Instalar dependencias** (si no lo has hecho):
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador**:
   ```
   http://localhost:3000/admin-registros.html
   ```

## 📋 Características

### ✅ Visualización de Datos
- **Tabla completa** con todos los registros de usuarios
- **Información mostrada**:
  - Fecha de registro
  - Nombre completo
  - Email
  - País
  - Teléfono
  - Número de documento
  - Fecha de nacimiento
  - Género

### 🔍 Búsqueda en Tiempo Real
- Busca por email, nombre, teléfono, país o documento
- Resultados instantáneos mientras escribes

### 📄 Paginación
- Navega entre páginas de resultados
- Controles: Primera, Anterior, Siguiente, Última página
- Muestra 50 registros por página

### 📊 Estadísticas
- Total de registros
- Página actual
- Total de páginas
- Registros mostrados en la página actual

### 💾 Exportar Datos
- **Botón "Exportar CSV"**: Descarga todos los registros filtrados
- Formato compatible con Excel y Google Sheets
- Nombre del archivo incluye la fecha: `registros_2025-10-30.csv`

### 🔄 Actualización Automática
- **Auto-refresh cada 30 segundos**
- **Botón "Actualizar"** para refrescar manualmente

## 🔒 ¿Cómo funciona?

La página consume el endpoint **GET `/api/registro`** que ya existía en tu proyecto:

```javascript
// Hace un fetch a tu API existente
fetch('/api/registro?pageSize=1000')
```

**No modifica ninguna lógica existente**, solo lee los datos almacenados en `/data/registrations.json`.

## 🎨 Diseño

- **Interfaz moderna** con gradientes y animaciones
- **Responsive**: Funciona en móviles, tablets y escritorio
- **Colores**: Gradiente morado/azul, tarjetas con sombras
- **Botones**: Hover effects y transiciones suaves

## 📝 Datos de Ejemplo

He incluido 3 registros de ejemplo en `/data/registrations.json` para que puedas ver cómo funciona. Estos datos son ficticios y puedes eliminarlos cuando tengas registros reales.

## ⚙️ Configuración (Opcional)

Si quieres cambiar el número máximo de registros almacenados, edita el archivo `.env`:

```env
REGISTRO_MAX_RECORDS=200
```

## 🔐 Seguridad

**IMPORTANTE**: Esta página NO tiene autenticación. Para uso en producción, deberías:

1. Agregar autenticación (usuario/contraseña)
2. Usar middleware de autenticación en Vercel
3. O restringir el acceso por IP

### Opción rápida: Proteger con Vercel Password

En tu archivo `vercel.json`, agrega:

```json
{
  "routes": [
    {
      "src": "/admin-registros.html",
      "headers": {
        "WWW-Authenticate": "Basic realm=\"Admin Panel\""
      },
      "status": 401
    }
  ]
}
```

O usa Vercel Password Protection en el dashboard de Vercel:
- Settings → Password Protection → Enable

## 📁 Archivos Creados

- `public/admin-registros.html` - Página principal del panel de admin
- `.env` - Variables de entorno mínimas
- `data/registrations.json` - Datos de ejemplo (3 registros ficticios)

## 🐛 Solución de Problemas

### "No hay registros"
- Verifica que `/data/registrations.json` tenga datos
- Revisa la consola del navegador (F12) para errores

### Error de conexión
- Asegúrate de que el servidor esté corriendo (`npm run dev`)
- Verifica que el endpoint `/api/registro` esté funcionando

### No se cargan los datos
- Abre las DevTools del navegador (F12)
- Ve a la pestaña "Network"
- Verifica que la petición a `/api/registro` devuelva 200 OK

## 📞 Soporte

Si tienes problemas, revisa:
1. Los logs de Vercel
2. La consola del navegador (F12)
3. El archivo `/data/registrations.json`

---

¡Listo! Ahora puedes ver todos los registros de usuarios en una interfaz visual bonita. 🎉
