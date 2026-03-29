const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Получить всех работников с услугами
router.get('/', async (req, res, next) => {
  try {
    const { rows: workers } = await db.query(
      `SELECT w.*
       FROM workers w
       WHERE w.approved = true
       ORDER BY w.created_at DESC`
    );
    const { rows: services } = await db.query('SELECT * FROM services');
    const result = workers.map(({ posted_by, ...w }) => ({
      ...w,
      services: services.filter(s => s.worker_id === w.id),
    }));
    res.json(result);
  } catch (e) { next(e); }
});

// Создать анкету работника
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, phone, category, profession, gender, experience, city,
            travel_cities, age, salary, salary_num, skills, about, photo, services } = req.body;

    // Базовая валидация
    if (!name || typeof name !== 'string' || name.trim().length < 2)
      return res.status(400).json({ error: 'Укажите имя (минимум 2 символа)' });
    if (!profession || typeof profession !== 'string' || profession.trim().length < 2)
      return res.status(400).json({ error: 'Укажите профессию' });
    if (!city || typeof city !== 'string' || city.trim().length < 2)
      return res.status(400).json({ error: 'Укажите город' });

    // Валидация фото: только base64 изображение, не более 2MB
    if (photo) {
      if (typeof photo !== 'string' || !photo.startsWith('data:image/'))
        return res.status(400).json({ error: 'Неверный формат фото' });
      const sizeKb = (photo.length * 3 / 4) / 1024;
      if (sizeKb > 2048)
        return res.status(400).json({ error: 'Фото не должно превышать 2 МБ' });
    }

    // Ограничение услуг
    if (services && services.length > 20)
      return res.status(400).json({ error: 'Максимум 20 услуг' });

    const { rows } = await db.query(
      `INSERT INTO workers(posted_by,name,phone,category,profession,gender,experience,
        city,travel_cities,age,salary,salary_num,skills,about,photo,photo_approved)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [req.user.id, name.trim(), phone || '', category || '', profession.trim(), gender || '',
       experience || '', city.trim(), travel_cities || [], parseInt(age) || 0,
       salary || '', parseInt(salary_num) || 0, skills || '', about || '',
       photo || null, !photo]
    );

    const worker = rows[0];

    if (services?.length) {
      for (const s of services.slice(0, 20)) {
        if (!s.name || typeof s.name !== 'string') continue;
        await db.query(
          'INSERT INTO services(worker_id,name,from_price,to_price,negotiable) VALUES($1,$2,$3,$4,$5)',
          [worker.id, s.name.slice(0, 200), s.from || null, s.to || null, s.negotiable || false]
        );
      }
    }

    res.json(worker);
  } catch (e) { next(e); }
});

// Обновить анкету
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const worker = await db.query('SELECT * FROM workers WHERE id=$1', [id]);
    if (!worker.rows.length) return res.status(404).json({ error: 'Не найдено' });

    const w = worker.rows[0];
    const isAdmin = req.user.role === 'admin';
    const isOwner = w.posted_by === req.user.id;

    if (!isAdmin && !isOwner)
      return res.status(403).json({ error: 'Нет доступа' });

    // Поля которые может менять владелец
    const userFields = ['name', 'profession', 'city', 'experience', 'salary', 'salary_num', 'skills', 'about', 'photo', 'portfolio_photos'];
    // Поля только для админа
    const adminFields = ['verified', 'approved', 'photo_approved'];

    const updates = [];
    const values = [];
    let i = 1;

    for (const f of userFields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f}=$${i}`);
        values.push(req.body[f]);
        i++;
      }
    }

    // Защищённые поля — только для админа
    if (isAdmin) {
      for (const f of adminFields) {
        if (req.body[f] !== undefined) {
          updates.push(`${f}=$${i}`);
          values.push(req.body[f]);
          i++;
        }
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'Нет полей для обновления' });

    values.push(id);
    const { rows } = await db.query(
      `UPDATE workers SET ${updates.join(',')} WHERE id=$${i} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// Удалить анкету (только admin)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db.query('DELETE FROM workers WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
