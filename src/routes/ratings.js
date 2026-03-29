const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Получить рейтинги (все или по работнику)
router.get('/', async (req, res, next) => {
  try {
    const worker_id = req.query.worker_id ? parseInt(req.query.worker_id) : null;
    if (req.query.worker_id && (!worker_id || isNaN(worker_id)))
      return res.status(400).json({ error: 'Неверный ID работника' });

    const query = worker_id
      ? 'SELECT * FROM ratings WHERE worker_id=$1'
      : 'SELECT * FROM ratings';
    const { rows } = await db.query(query, worker_id ? [worker_id] : []);
    res.json(rows);
  } catch (e) { next(e); }
});

// Поставить оценку
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const worker_id = parseInt(req.body.worker_id);
    const order_id = parseInt(req.body.order_id);
    const score = parseInt(req.body.score);
    const employer_id = req.user.id;

    if (isNaN(worker_id) || worker_id <= 0)
      return res.status(400).json({ error: 'Неверный ID работника' });
    if (isNaN(order_id) || order_id <= 0)
      return res.status(400).json({ error: 'Неверный ID заказа' });
    if (!score || score < 1 || score > 5)
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });

    const dup = await db.query(
      'SELECT id FROM ratings WHERE order_id=$1 AND employer_id=$2',
      [order_id, employer_id]
    );
    if (dup.rows.length)
      return res.status(400).json({ error: 'Вы уже оценили этот заказ' });

    const { rows } = await db.query(
      `INSERT INTO ratings(worker_id,employer_id,order_id,score) VALUES($1,$2,$3,$4) RETURNING *`,
      [worker_id, employer_id, order_id, score]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;
