// routes/services.js — CRUD de servicios DetailingHouse
const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/services/last-update — Timestamp de última actualización (público)
// NOTA: debe ir ANTES de '/:id' para que Express no lo capture como id.
router.get('/last-update', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT MAX(updated_at) AS last_update FROM services'
    );
    res.json({ last_update: rows[0].last_update });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services — Listar servicios activos (público: sin auth para catálogo)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, price, description, emoji, category, duration, active
       FROM services
       WHERE active = true
       ORDER BY category, name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/:id — Detalle de un servicio (público)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services — Crear servicio (solo admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { id, name, price, description, emoji, category, duration } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: 'ID y nombre son requeridos' });
  }
  if (price !== undefined && (isNaN(price) || price < 0)) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO services (id, name, price, description, emoji, category, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        name,
        price !== undefined ? parseFloat(price) : 0,
        description || null,
        emoji || null,
        category || 'principal',
        duration !== undefined && duration !== null ? parseInt(duration) : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ID de servicio ya existe' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/services/:id — Actualizar campos del servicio (solo admin)
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, price, description, emoji, category, duration } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined)         { fields.push(`name = $${idx++}`);         values.push(name); }
  if (price !== undefined)        { fields.push(`price = $${idx++}`);        values.push(parseFloat(price)); }
  if (description !== undefined)  { fields.push(`description = $${idx++}`);  values.push(description); }
  if (emoji !== undefined)        { fields.push(`emoji = $${idx++}`);        values.push(emoji); }
  if (category !== undefined)     { fields.push(`category = $${idx++}`);     values.push(category); }
  if (duration !== undefined)     { fields.push(`duration = $${idx++}`);     values.push(parseInt(duration)); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  values.push(req.params.id);

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE services SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rowCount) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ ok: true, service: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/:id — Desactivar servicio (solo admin, soft delete)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE services SET active = false, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ ok: true, message: 'Servicio desactivado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;