// routes/inventory.js — Inventario A1A
const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/inventory — Listar todo el inventario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM inventory WHERE active = true ORDER BY category, name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/:sku — Detalle de un producto
router.get('/:sku', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM inventory WHERE sku = $1',
      [req.params.sku]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:sku/stock — Actualizar stock
router.put('/:sku/stock', authMiddleware, async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || stock < 0)
    return res.status(400).json({ error: 'Stock inválido' });

  try {
    const { rows, rowCount } = await pool.query(
      'UPDATE inventory SET stock = $1, updated_at = NOW() WHERE sku = $2 RETURNING *',
      [stock, req.params.sku]
    );
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:sku/price — Actualizar precio (solo admin)
router.put('/:sku/price', authMiddleware, adminOnly, async (req, res) => {
  const { price } = req.body;
  if (price === undefined || isNaN(price) || price < 0)
    return res.status(400).json({ error: 'Precio inválido' });

  try {
    const { rows, rowCount } = await pool.query(
      'UPDATE inventory SET price = $1, updated_at = NOW() WHERE sku = $2 RETURNING *',
      [parseFloat(price), req.params.sku]
    );
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:sku — Actualizar campos del producto (solo admin)
router.patch('/:sku', authMiddleware, adminOnly, async (req, res) => {
  const { price, name, stock, description, image_url, presentation } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;

  if (price !== undefined)        { fields.push(`price = $${idx++}`);        values.push(parseFloat(price)); }
  if (name !== undefined)         { fields.push(`name = $${idx++}`);         values.push(name); }
  if (stock !== undefined)        { fields.push(`stock = $${idx++}`);        values.push(parseInt(stock)); }
  if (description !== undefined)  { fields.push(`description = $${idx++}`);  values.push(description); }
  if (image_url !== undefined)    { fields.push(`image_url = $${idx++}`);    values.push(image_url); }
  if (presentation !== undefined) { fields.push(`presentation = $${idx++}`); values.push(presentation); }

  if (fields.length === 0)
    return res.status(400).json({ error: 'No hay campos para actualizar' });

  values.push(req.params.sku);

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE inventory SET ${fields.join(', ')}, updated_at = NOW() WHERE sku = $${idx} RETURNING *`,
      values
    );
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory — Agregar producto (admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { sku, name, category, category_label, price, stock, presentation, description, image_url } = req.body;
  if (!sku || !name || !category)
    return res.status(400).json({ error: 'SKU, nombre y categoría son requeridos' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO inventory (sku, name, category, category_label, price, stock, presentation, description, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [sku, name, category, category_label || category, price || 0, stock || 0, presentation || '', description || '', image_url || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU ya existe' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inventory/:sku — Desactivar producto (solo admin)
router.delete('/:sku', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE inventory SET active = false, updated_at = NOW() WHERE sku = $1',
      [req.params.sku]
    );
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, message: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/seed — Cargar catálogo A1A completo (admin, solo si está vacío)
router.post('/seed', authMiddleware, adminOnly, async (req, res) => {
  const { catalog } = req.body;
  if (!Array.isArray(catalog) || catalog.length === 0)
    return res.status(400).json({ error: 'Catálogo vacío' });

  try {
    const existing = await pool.query('SELECT COUNT(*) FROM inventory');
    if (parseInt(existing.rows[0].count) > 0)
      return res.status(409).json({ error: 'Inventario ya tiene datos', count: existing.rows[0].count });

    let inserted = 0;
    for (const p of catalog) {
      await pool.query(
        `INSERT INTO inventory (sku, name, category, category_label, price, stock, presentation, description, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (sku) DO NOTHING`,
        [p.sku, p.name, p.category, p.categoryLabel || p.category, p.price || 0, p.stock || 0, p.presentation || '', p.description || '', p.image_url || '']
      );
      inserted++;
    }
    res.json({ ok: true, inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
