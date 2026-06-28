// routes/clients.js — Clientes + puntos de fidelidad
const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// GET /api/clients
router.get('/', authMiddleware, async (req, res) => {
  const { q } = req.query;
  try {
    let query = 'SELECT * FROM clients WHERE active = true';
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (name ILIKE $1 OR phone ILIKE $1)`;
    }
    query += ' ORDER BY name';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(s.id) AS visits
       FROM clients c
       LEFT JOIN sales s ON s.client_id = c.id
       WHERE c.id = $1 AND c.active = true
       GROUP BY c.id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients — Crear cliente
router.post('/', authMiddleware, async (req, res) => {
  const { name, phone, car_type, car_plate, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO clients (name, phone, car_type, car_plate, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, phone || '', car_type || '', car_plate || '', notes || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/:id — Actualizar cliente
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, phone, car_type, car_plate, notes } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE clients SET name=$1, phone=$2, car_type=$3, car_plate=$4, notes=$5, updated_at=NOW()
       WHERE id=$6 AND active=true RETURNING *`,
      [name, phone, car_type, car_plate, notes, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients/:id/points — Sumar/restar puntos
router.post('/:id/points', authMiddleware, async (req, res) => {
  const { delta } = req.body; // positivo = sumar, negativo = restar
  if (delta === undefined) return res.status(400).json({ error: 'delta requerido' });

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE clients SET points = GREATEST(0, points + $1), updated_at = NOW()
       WHERE id = $2 AND active = true RETURNING id, name, points`,
      [delta, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
