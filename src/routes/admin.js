const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Все пользователи
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id,name,phone,phone2,role,registered_at FROM users ORDER BY id'
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Одобрить фото
router.patch('/workers/:id/approve-photo', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Неверный ID' });
    const { rows } = await db.query(
      'UPDATE workers SET photo_approved=true WHERE id=$1 RETURNING *',
      [id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// Верифицировать работника
router.patch('/workers/:id/verify', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Неверный ID' });
    const { rows } = await db.query(
      'UPDATE workers SET verified=true WHERE id=$1 RETURNING *',
      [id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;
