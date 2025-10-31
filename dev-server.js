import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import registroHandler from './api/registro.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de public
app.use(express.static(path.join(__dirname, 'public')));

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
  console.log('📊 Panel de Administración:');
  console.log(`   http://localhost:${PORT}/admin-registros.html`);
  console.log('');
  console.log('📝 API de Registro:');
  console.log(`   http://localhost:${PORT}/api/registro`);
  console.log('');
  console.log('🛑 Presiona Ctrl+C para detener el servidor');
  console.log('======================================');
  console.log('');
});
