// routes/cash.js — Caja chica + nómina 35/35/30
const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ─── CAJA CHICA ──────────────────────────────────────────

// GET /api/cash/active — Sesión de caja activa
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cs.*, 
        json_agg(cm.*) FILTER (WHERE cm.id IS NOT NULL) AS movements
       FROM cash_sessions cs
       LEFT JOIN cash_movements cm ON cm.session_id = cs.id
       WHERE cs.closed = false
       GROUP BY cs.id
       ORDER BY cs.opened_at DESC LIMIT 1`
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cash/open — Abrir caja
router.post('/open', authMiddleware, async (req, res) => {
  const { initial_amount } = req.body;
  try {
    // Cerrar cualquier caja abierta primero
    await pool.query("UPDATE cash_sessions SET closed=true, closed_at=NOW() WHERE closed=false");

    const { rows } = await pool.query(
      `INSERT INTO cash_sessions (initial_amount, opened_by)
       VALUES ($1,$2) RETURNING *`,
      [initial_amount || 0, req.user?.id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cash/movement — Registrar movimiento (ingreso/gasto)
router.post('/movement', authMiddleware, async (req, res) => {
  const { kind, description, category, amount } = req.body;
  if (!kind || !amount) return res.status(400).json({ error: 'kind y amount requeridos' });

  try {
    // Obtener sesión activa
    const sess = await pool.query("SELECT id FROM cash_sessions WHERE closed=false LIMIT 1");
    if (!sess.rows[0]) return res.status(400).json({ error: 'No hay caja abierta' });

    const { rows } = await pool.query(
      `INSERT INTO cash_movements (session_id, kind, description, category, amount)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [sess.rows[0].id, kind, description || '', category || 'general', amount]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cash/close — Cerrar caja
router.post('/close', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows, rowCount } = await pool.query(
      "UPDATE cash_sessions SET closed=true, closed_at=NOW() WHERE closed=false RETURNING *"
    );
    if (!rowCount) return res.status(400).json({ error: 'No hay caja abierta' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NÓMINA 35/35/30 ─────────────────────────────────────

// GET /api/cash/payroll — Historial de cortes
router.get('/payroll', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM payroll_cuts ORDER BY created_at DESC LIMIT 20'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cash/payroll/cut — Generar corte de nómina
router.post('/payroll/cut', authMiddleware, adminOnly, async (req, res) => {
  const { period, date_from, date_to, andres_pct = 35, erika_pct = 35, local_pct = 30 } = req.body;
  if (!period || !date_from || !date_to)
    return res.status(400).json({ error: 'period, date_from y date_to requeridos' });

  try {
    // Calcular ventas en el rango
    const salesRes = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM sales WHERE created_at::date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );
    const total_sales = parseFloat(salesRes.rows[0].total);
    const andres_amt  = +(total_sales * andres_pct / 100).toFixed(2);
    const erika_amt   = +(total_sales * erika_pct  / 100).toFixed(2);
    const local_amt   = +(total_sales * local_pct  / 100).toFixed(2);

    const { rows } = await pool.query(
      `INSERT INTO payroll_cuts
         (period, date_from, date_to, total_sales, andres_pct, erika_pct, local_pct, andres_amt, erika_amt, local_amt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [period, date_from, date_to, total_sales, andres_pct, erika_pct, local_pct, andres_amt, erika_amt, local_amt]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
