// routes/appointments.js — Agenda de citas
const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// GET /api/appointments — Listar citas (filtro por mes)
router.get('/', authMiddleware, async (req, res) => {
  const { month, year } = req.query; // YYYY-MM o year+month
  try {
    let q = 'SELECT * FROM appointments';
    const params = [];
    if (month && year) {
      params.push(year, month);
      q += ' WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2';
    }
    q += ' ORDER BY date, time';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/today
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM appointments WHERE date = CURRENT_DATE ORDER BY time"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments — Crear cita
router.post('/', authMiddleware, async (req, res) => {
  const { client, service, date, time, address, notes } = req.body;
  if (!client || !service || !date || !time)
    return res.status(400).json({ error: 'Cliente, servicio, fecha y hora son requeridos' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO appointments (client, service, date, time, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [client, service, date, time, address || '', notes || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/appointments/:id — Actualizar estado
router.put('/:id', authMiddleware, async (req, res) => {
  const { status, notes, address, date, time } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE appointments SET
        status = COALESCE($1, status),
        notes  = COALESCE($2, notes),
        address= COALESCE($3, address),
        date   = COALESCE($4::date, date),
        time   = COALESCE($5::time, time),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [status || null, notes || null, address || null, date || null, time || null, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/appointments/:id — Cancelar cita
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE appointments SET status='cancelada', updated_at=NOW() WHERE id=$1",
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
