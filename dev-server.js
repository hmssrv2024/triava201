import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import registroHandler from './api/registro.js';
import loginHandler from './api/auth/login.js';
import verifyHandler from './api/auth/verify.js';
import logoutHandler from './api/auth/logout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de public
app.use(express.static(path.join(__dirname, 'public')));

// Auth API Routes
app.all('/api/auth/login', async (req, res) => {
  try {
    await loginHandler(req, res);
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.all('/api/auth/verify', async (req, res) => {
  try {
    await verifyHandler(req, res);
  } catch (error) {
    console.error('Error en /api/auth/verify:', error);
    res.status(500).json({ authenticated: false, error: error.message });
  }
});

app.all('/api/auth/logout', async (req, res) => {
  try {
    await logoutHandler(req, res);
  } catch (error) {
    console.error('Error en /api/auth/logout:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// API Routes
app.all('/api/registro', async (req, res) => {
  try {
    await registroHandler(req, res);
  } catch (error) {
    console.error('Error en /api/registro:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// SPA fallback - redirigir todo a index.html si no es una ruta de API
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const filePath = path.join(__dirname, 'public', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ======================================');
  console.log(`✅ Servidor iniciado en puerto ${PORT}`);
  console.log('');
  console.log('🔐 Login Admin:');
  console.log(`   http://localhost:${PORT}/admin-login.html`);
  console.log('');
  console.log('📊 Panel de Administración:');
  console.log(`   http://localhost:${PORT}/admin-registros.html`);
  console.log('');
  console.log('📝 Página de Registro:');
  console.log(`   http://localhost:${PORT}/registro.html`);
  console.log('');
  console.log('👤 Credenciales:');
  console.log(`   Usuario: ${process.env.ADMIN_USERNAME || 'admin'}`);
  console.log(`   Contraseña: *** (ver .env)`);
  console.log('');
  console.log('🛑 Presiona Ctrl+C para detener el servidor');
  console.log('======================================');
  console.log('');
});
