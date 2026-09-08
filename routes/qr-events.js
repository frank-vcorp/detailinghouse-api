// routes/qr-events.js — Contadores agregados para el QR /citas (FEATURE-20260907-01)
// SPEC-20260907-01 / ADR-20260907-01
//
// Sólo persiste totales agregados (visit, whatsapp_open). No guarda IP, user-agent
// ni datos personales. El endpoint público está protegido por el rate limit global
// de /api/ aplicado en server.js.

const router  = require('express').Router();
const pool    = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const ALLOWED_EVENTS = ['visit', 'whatsapp_open'];

// POST /api/qr-events — Incrementar contador (público)
router.post('/', async (req, res) => {
  const event = req.body && req.body.event;
  if (!event || !ALLOWED_EVENTS.includes(event)) {
    return res.status(400).json({ error: 'Evento inválido' });
  }

  try {
    await pool.query(
      `INSERT INTO qr_event_counters (event, total, updated_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (event)
       DO UPDATE SET total = qr_event_counters.total + 1, updated_at = NOW()`,
      [event]
    );
    return res.status(202).json({ ok: true });
  } catch (err) {
    console.error('❌ [qr-events] POST error:', err.message);
    // No propagamos el detalle al cliente para no filtrar el esquema.
    return res.status(500).json({ error: 'No se pudo registrar el evento' });
  }
});

// GET /api/qr-events/summary — Totales (sólo admin)
router.get('/summary', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT event, total FROM qr_event_counters WHERE event = ANY($1::varchar[])`,
      [ALLOWED_EVENTS]
    );
    const summary = { visit: 0, whatsapp_open: 0 };
    rows.forEach(r => { summary[r.event] = Number(r.total) || 0; });
    return res.json(summary);
  } catch (err) {
    console.error('❌ [qr-events] GET summary error:', err.message);
    return res.status(500).json({ error: 'No se pudo obtener el resumen' });
  }
});

module.exports = router;
