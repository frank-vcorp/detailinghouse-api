// routes/sales.js — Ventas + líneas
const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/sales — Historial de ventas
router.get('/', authMiddleware, async (req, res) => {
  const { from, to, limit = 50 } = req.query;
  try {
    let q = `
      SELECT s.*, 
        json_agg(json_build_object('sku',si.sku,'name',si.name,'price',si.price,'qty',si.qty,'subtotal',si.subtotal)) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
    `;
    const params = [];
    const conds = [];
    if (from) { params.push(from); conds.push(`s.created_at >= $${params.length}::date`); }
    if (to)   { params.push(to);   conds.push(`s.created_at < ($${params.length}::date + interval '1 day')`); }
    if (conds.length) q += ' WHERE ' + conds.join(' AND ');
    q += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/today — Ventas del día
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*,
        json_agg(json_build_object('sku',si.sku,'name',si.name,'price',si.price,'qty',si.qty,'subtotal',si.subtotal)) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE s.created_at >= CURRENT_DATE
      GROUP BY s.id ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/dashboard — KPIs del dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const today = await pool.query(`
      SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue
      FROM sales WHERE created_at >= CURRENT_DATE
    `);
    const week = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS revenue
      FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    const month = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS revenue
      FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `);
    const clients_today = await pool.query(`
      SELECT COUNT(DISTINCT client_id) AS count
      FROM sales WHERE created_at >= CURRENT_DATE AND client_id IS NOT NULL
    `);
    const low_stock = await pool.query(`
      SELECT COUNT(*) AS count FROM inventory WHERE stock <= 3 AND active = true
    `);
    const chart = await pool.query(`
      SELECT DATE(created_at) AS day, COALESCE(SUM(total),0) AS total
      FROM sales
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY day ORDER BY day
    `);

    res.json({
      today: { count: parseInt(today.rows[0].count), revenue: parseFloat(today.rows[0].revenue) },
      week:  { revenue: parseFloat(week.rows[0].revenue) },
      month: { revenue: parseFloat(month.rows[0].revenue) },
      clients_today: parseInt(clients_today.rows[0].count),
      low_stock: parseInt(low_stock.rows[0].count),
      chart: chart.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales — Registrar venta
router.post('/', authMiddleware, async (req, res) => {
  const { items, subtotal, fee, fee_rate, total, payment_method, client_id, client_name } = req.body;
  if (!items?.length || !total)
    return res.status(400).json({ error: 'Items y total son requeridos' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar venta
    const saleRes = await client.query(
      `INSERT INTO sales (client_id, client_name, subtotal, fee, fee_rate, total, payment_method, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [client_id || null, client_name || '', subtotal || 0, fee || 0, fee_rate || 0, total, payment_method || 'efectivo', req.user?.id || null]
    );
    const sale = saleRes.rows[0];

    // Insertar líneas
    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (sale_id, sku, name, price, qty, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [sale.id, item.sku || '', item.name, item.price, item.qty || 1, item.price * (item.qty || 1)]
      );
    }

    // Sumar puntos al cliente (1 punto por cada $100)
    if (client_id) {
      const pts = Math.floor(total / 100);
      await client.query(
        'UPDATE clients SET points = points + $1, updated_at = NOW() WHERE id = $2',
        [pts, client_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...sale, items });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
