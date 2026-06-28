// server.js — DetailingHouse API Principal
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const pool       = require('./db/pool');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: [
    'https://detailinghouse-tawny.vercel.app',
    'http://localhost:8080',
    'http://localhost:3000',
    /\.railway\.app$/,
    /\.vercel\.app$/,
  ],
  credentials: true
}));

// Rate limiting — máx 100 req/min por IP
const limiter = rateLimit({ windowMs: 60_000, max: 100, message: { error: 'Demasiadas solicitudes' } });
app.use('/api/', limiter);

// Rate limiting estricto para login — máx 10/min
const loginLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: 'Demasiados intentos de login' } });
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '2mb' }));

// ── Rutas ────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/clients',      require('./routes/clients'));
app.use('/api/sales',        require('./routes/sales'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/cash',         require('./routes/cash'));

// ── Health check ─────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Root ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'DetailingHouse API',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/inventory', '/api/clients', '/api/sales', '/api/appointments', '/api/cash'],
    health: '/health'
  });
});

// ── Error handler ────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

// ── Arranque ─────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 DetailingHouse API corriendo en puerto ${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL conectado');
    // Auto-migrar en producción
    if (process.env.AUTO_MIGRATE === 'true') {
      console.log('🔧 Ejecutando migraciones automáticas...');
      require('./db/migrate');
    }
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  }
});
