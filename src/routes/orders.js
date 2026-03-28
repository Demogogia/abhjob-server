const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Мои заказы
router.get('/', requireAuth, async (req, res) => {
  const { role, id } = req.user;
  const col = role === 'employer' ? 'employer_id' : 'worker_id';

  let query, params;
  if (role === 'seeker') {
    // Для работника — заказы по его анкетам
    const { rows: myWorkers } = await db.query(
      'SELECT id FROM workers WHERE posted_by=$1', [id]
    );
    const workerIds = myWorkers.map(w => w.id);
    if (!workerIds.length) return res.json([]);
    query = `SELECT * FROM orders WHERE worker_id = ANY($1) ORDER BY created_at DESC`;
    params = [workerIds];
  } else {
    query = `SELECT * FROM orders WHERE ${col}=$1 ORDER BY created_at DESC`;
    params = [id];
  }

  const { rows } = await db.query(query, params);
  res.json(rows);
});

// Создать заказ
router.post('/', requireAuth, async (req, res) => {
  const { worker_id } = req.body;
  const employer_id = req.user.id;

  // Проверяем дубликат
  const dup = await db.query(
    `SELECT id FROM orders WHERE worker_id=$1 AND employer_id=$2 AND status='active'`,
    [worker_id, employer_id]
  );
  if (dup.rows.length)
    return res.status(400).json({ error: 'Заказ с этим специалистом уже активен' });

  const worker = await db.query('SELECT * FROM workers WHERE id=$1', [worker_id]);
  if (!worker.rows.length) return res.status(404).json({ error: 'Специалист не найден' });

  const employer = await db.query('SELECT name FROM users WHERE id=$1', [employer_id]);
  const w = worker.rows[0];
  const e = employer.rows[0];

  const { rows } = await db.query(
    `INSERT INTO orders(worker_id,worker_name,worker_profession,worker_phone,employer_id,employer_name)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [worker_id, w.name, w.profession, w.phone, employer_id, e.name]
  );
  res.json(rows[0]);
});

// Отметить выполненным
router.patch('/:id/complete', requireAuth, async (req, res) => {
  const order = await db.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
  if (!order.rows.length) return res.status(404).json({ error: 'Не найдено' });
  if (order.rows[0].employer_id !== req.user.id)
    return res.status(403).json({ error: 'Нет доступа' });

  const { rows } = await db.query(
    `UPDATE orders SET status='completed', completed_at=CURRENT_DATE WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  res.json(rows[0]);
});

module.exports = router;
