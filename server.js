// server.js — DetailingHouse API Principal
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const pool       = require('./db/pool');

const app  = express();
const PORT = process.env.PORT || 3000;

console.log(`⚙️  Iniciando DetailingHouse API...`);
console.log(`⚙️  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`⚙️  PORT: ${PORT}`);
console.log(`⚙️  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ presente' : '❌ FALTA'}`);

// ── Seguridad ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: [
    'https://detailinghouse-tawny.vercel.app',
    /\.railway\.app$/,
    /\.vercel\.app$/,
    'http://localhost:8080',
    'http://localhost:3000',
  ],
  credentials: true
}));

const limiter = rateLimit({ windowMs: 60_000, max: 200, message: { error: 'Demasiadas solicitudes' } });
app.use('/api/', limiter);

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
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', detail: err.message });
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
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 DetailingHouse API escuchando en 0.0.0.0:${PORT}`);

  // Verificar BD (sin crashear si falla)
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL conectado');
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.error('   DATABASE_URL:', process.env.DATABASE_URL ? 'presente pero falla' : 'NO DEFINIDA');
    // NO hacer process.exit — el servidor sigue vivo
  }

  // Auto-migrar si está configurado
  if (process.env.AUTO_MIGRATE === 'true') {
    console.log('🔧 Ejecutando migraciones...');
    try {
      const { Pool } = require('pg');
      const migPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const migClient = await migPool.connect();
      
      const bcrypt = require('bcryptjs');
      
      // Crear tablas
      await migClient.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'staff',
          name VARCHAR(100),
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS inventory (
          sku VARCHAR(20) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          category_label VARCHAR(60),
          price NUMERIC(10,2) NOT NULL DEFAULT 0,
          stock INTEGER NOT NULL DEFAULT 0,
          presentation VARCHAR(50),
          description TEXT,
          image_url TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          car_type VARCHAR(50),
          car_plate VARCHAR(20),
          notes TEXT,
          points INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sales (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
          client_name VARCHAR(100),
          subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
          fee NUMERIC(10,2) NOT NULL DEFAULT 0,
          fee_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
          total NUMERIC(10,2) NOT NULL DEFAULT 0,
          payment_method VARCHAR(30) NOT NULL DEFAULT 'efectivo',
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sale_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          sku VARCHAR(20),
          name VARCHAR(100) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          qty INTEGER NOT NULL DEFAULT 1,
          subtotal NUMERIC(10,2) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client VARCHAR(100) NOT NULL,
          service VARCHAR(100) NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          address TEXT,
          notes TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cash_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          initial_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
          opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          closed_at TIMESTAMPTZ,
          closed BOOLEAN NOT NULL DEFAULT false,
          opened_by UUID REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS cash_movements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
          kind VARCHAR(10) NOT NULL,
          description VARCHAR(200),
          category VARCHAR(50),
          amount NUMERIC(10,2) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS payroll_cuts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          period VARCHAR(10) NOT NULL,
          date_from DATE NOT NULL,
          date_to DATE NOT NULL,
          total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
          andres_pct NUMERIC(5,2) NOT NULL DEFAULT 35,
          erika_pct NUMERIC(5,2) NOT NULL DEFAULT 35,
          local_pct NUMERIC(5,2) NOT NULL DEFAULT 30,
          andres_amt NUMERIC(10,2) NOT NULL DEFAULT 0,
          erika_amt NUMERIC(10,2) NOT NULL DEFAULT 0,
          local_amt NUMERIC(10,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
        CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS car_type VARCHAR(50);
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS car_plate VARCHAR(20);
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
      `);
      console.log('✅ Tablas creadas');

      // Crear usuarios si no existen
      const exists = await migClient.query("SELECT id FROM users WHERE username='admin'");
      if (exists.rows.length === 0) {
        const h1 = await bcrypt.hash('DH2025', 12);
        const h2 = await bcrypt.hash('DH-STAFF', 12);
        await migClient.query(
          "INSERT INTO users (username,password,role,name) VALUES ($1,$2,'admin','Administrador'),($3,$4,'staff','Empleado')",
          ['admin', h1, 'staff', h2]
        );
        console.log('✅ Usuarios admin y staff creados');
      } else {
        console.log('ℹ️  Usuarios ya existen');
      }

      migClient.release();
      await migPool.end();
      console.log('✅ Migración completada');
    } catch (err) {
      console.error('❌ Error en migración:', err.message);
    }
  }
});

server.on('error', (err) => {
  console.error('❌ Error del servidor:', err.message);
  process.exit(1);
});
