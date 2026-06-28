// db/migrate.js — Crea todas las tablas en PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SQL = `
-- ============================================================
-- DETAILINGHOUSE — Esquema PostgreSQL completo
-- ============================================================

-- Usuarios (autenticación segura)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  role        VARCHAR(20) NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  name        VARCHAR(100),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventario A1A (30 productos base + los que agreguen)
CREATE TABLE IF NOT EXISTS inventory (
  sku           VARCHAR(20) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(50) NOT NULL,
  category_label VARCHAR(60),
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock         INTEGER NOT NULL DEFAULT 0,
  presentation  VARCHAR(50),
  description   TEXT,
  image_url     TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes con puntos de fidelidad
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  car_type    VARCHAR(50),
  car_plate   VARCHAR(20),
  notes       TEXT,
  points      INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ventas (cabecera)
CREATE TABLE IF NOT EXISTS sales (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name    VARCHAR(100),
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee            NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_rate       NUMERIC(5,4) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'efectivo',
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Líneas de venta (items del carrito)
CREATE TABLE IF NOT EXISTS sale_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id   UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sku       VARCHAR(20),
  name      VARCHAR(100) NOT NULL,
  price     NUMERIC(10,2) NOT NULL,
  qty       INTEGER NOT NULL DEFAULT 1,
  subtotal  NUMERIC(10,2) NOT NULL
);

-- Citas / Agenda
CREATE TABLE IF NOT EXISTS appointments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client     VARCHAR(100) NOT NULL,
  service    VARCHAR(100) NOT NULL,
  date       DATE NOT NULL,
  time       TIME NOT NULL,
  address    TEXT,
  notes      TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'pendiente',  -- pendiente|confirmada|completada|cancelada
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sesiones de caja chica
CREATE TABLE IF NOT EXISTS cash_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initial_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at      TIMESTAMPTZ,
  closed         BOOLEAN NOT NULL DEFAULT false,
  opened_by      UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Movimientos de caja (ingresos y gastos)
CREATE TABLE IF NOT EXISTS cash_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  kind        VARCHAR(10) NOT NULL,   -- 'ingreso' | 'gasto'
  description VARCHAR(200),
  category    VARCHAR(50),
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cortes de nómina (35/35/30)
CREATE TABLE IF NOT EXISTS payroll_cuts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period      VARCHAR(10) NOT NULL,   -- 'weekly' | 'monthly'
  date_from   DATE NOT NULL,
  date_to     DATE NOT NULL,
  total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  andres_pct  NUMERIC(5,2) NOT NULL DEFAULT 35,
  erika_pct   NUMERIC(5,2) NOT NULL DEFAULT 35,
  local_pct   NUMERIC(5,2) NOT NULL DEFAULT 30,
  andres_amt  NUMERIC(10,2) NOT NULL DEFAULT 0,
  erika_amt   NUMERIC(10,2) NOT NULL DEFAULT 0,
  local_amt   NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at    ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_id     ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date   ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_cash_movements_sess ON cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone       ON clients(phone);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔧 Ejecutando migraciones...');
    await client.query(SQL);
    console.log('✅ Tablas creadas correctamente');

    // Crear usuario admin por defecto si no existe
    const bcrypt = require('bcryptjs');
    const exists = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash('DH2025', 12);
      await client.query(
        "INSERT INTO users (username, password, role, name) VALUES ($1, $2, 'admin', $3)",
        ['admin', hash, 'Administrador']
      );
      const hashStaff = await bcrypt.hash('DH-STAFF', 12);
      await client.query(
        "INSERT INTO users (username, password, role, name) VALUES ($1, $2, 'staff', $3)",
        ['staff', hashStaff, 'Empleado']
      );
      console.log('✅ Usuarios iniciales creados (admin / staff)');
    }
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
