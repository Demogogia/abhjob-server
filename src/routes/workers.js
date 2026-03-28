const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Получить всех работников с услугами
router.get('/', async (req, res) => {
  const { rows: workers } = await db.query(
    `SELECT w.*, u.phone as user_phone
     FROM workers w
     LEFT JOIN users u ON u.id = w.posted_by
     WHERE w.approved = true
     ORDER BY w.created_at DESC`
  );

  const { rows: services } = await db.query('SELECT * FROM services');

  const result = workers.map(w => ({
    ...w,
    services: services.filter(s => s.worker_id === w.id),
  }));

  res.json(result);
});

// Создать анкету работника
router.post('/', requireAuth, async (req, res) => {
  const { name, phone, category, profession, gender, experience, city,
          travel_cities, age, salary, salary_num, skills, about, photo, services } = req.body;

  const { rows } = await db.query(
    `INSERT INTO workers(posted_by,name,phone,category,profession,gender,experience,
      city,travel_cities,age,salary,salary_num,skills,about,photo,photo_approved)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [req.user.id, name, phone, category, profession, gender, experience,
     city, travel_cities || [], age, salary, salary_num || 0,
     skills, about, photo || null, !photo]
  );

  const worker = rows[0];

  if (services?.length) {
    for (const s of services) {
      await db.query(
        'INSERT INTO services(worker_id,name,from_price,to_price,negotiable) VALUES($1,$2,$3,$4,$5)',
        [worker.id, s.name, s.from || null, s.to || null, s.negotiable || false]
      );
    }
  }

  res.json(worker);
});

// Обновить анкету (admin или владелец)
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const worker = await db.query('SELECT * FROM workers WHERE id=$1', [id]);
  if (!worker.rows.length) return res.status(404).json({ error: 'Не найдено' });

  const w = worker.rows[0];
  if (req.user.role !== 'admin' && w.posted_by !== req.user.id)
    return res.status(403).json({ error: 'Нет доступа' });

  const fields = ['name','profession','city','experience','salary','salary_num',
                  'skills','about','verified','approved','photo_approved','photo'];
  const updates = [];
  const values = [];
  let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f}=$${i}`);
      values.push(req.body[f]);
      i++;
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Нет полей для обновления' });

  values.push(id);
  const { rows } = await db.query(
    `UPDATE workers SET ${updates.join(',')} WHERE id=$${i} RETURNING *`,
    values
  );
  res.json(rows[0]);
});

// Удалить анкету (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM workers WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
