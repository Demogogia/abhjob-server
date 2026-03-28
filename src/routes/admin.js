const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Все пользователи
router.get('/users', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id,name,phone,phone2,role,registered_at FROM users ORDER BY id'
  );
  res.json(rows);
});

// Одобрить фото
router.patch('/workers/:id/approve-photo', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    'UPDATE workers SET photo_approved=true WHERE id=$1 RETURNING *',
    [req.params.id]
  );
  res.json(rows[0]);
});

// Верифицировать работника
router.patch('/workers/:id/verify', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    'UPDATE workers SET verified=true WHERE id=$1 RETURNING *',
    [req.params.id]
  );
  res.json(rows[0]);
});

module.exports = router;
