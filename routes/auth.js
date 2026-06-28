// routes/auth.js — Login / logout / cambio de contraseña
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authMiddleware, adminOnly, SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND active = true',
      [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me — Verificar token
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/password — Cambiar contraseña (admin)
router.put('/password', authMiddleware, adminOnly, async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Datos inválidos (mínimo 6 caracteres)' });

  try {
    const hash = await bcrypt.hash(newPassword, 12);
    const { rowCount } = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE username = $2',
      [hash, username]
    );
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/users — Listar usuarios (admin)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role, name, active, created_at FROM users ORDER BY created_at'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/users — Crear usuario (admin)
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, role, name } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password, role, name) VALUES ($1,$2,$3,$4) RETURNING id, username, role, name',
      [username, hash, role, name || username]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Usuario ya existe' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
