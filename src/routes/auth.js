const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendSms, generateCode } = require('../smsc');

const cookieOpts = (rememberMe) => ({
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
});

// Нормализация телефона: 8XXXXXXXXXX → +7XXXXXXXXXX, +7XXXXXXXXXX → без изменений
function normalizePhone(p) {
  if (typeof p !== 'string') return null;
  const s = p.trim();
  if (/^\+\d{10,12}$/.test(s)) return s;
  if (/^8\d{10}$/.test(s)) return '+7' + s.slice(1);
  return null;
}

// Валидация телефона
function validPhone(p) {
  return normalizePhone(p) !== null;
}

// Отправить SMS код
router.post('/sms/send', async (req, res, next) => {
  try {
    const { phone: rawPhone } = req.body;
    const phone = normalizePhone(rawPhone);
    if (!phone)
      return res.status(400).json({ error: 'Неверный формат номера телефона' });

    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `INSERT INTO sms_codes(phone, code, expires_at)
       VALUES($1,$2,$3)
       ON CONFLICT(phone) DO UPDATE SET code=$2, expires_at=$3`,
      [phone, code, expires]
    );

    await sendSms(phone, `Ваш код AbhJob: ${code}`);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Регистрация с SMS-кодом
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone: rawPhone, password, role, smsCode, rememberMe } = req.body;
    const phone = normalizePhone(rawPhone);

    // Валидация
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)
      return res.status(400).json({ error: 'Имя должно содержать от 2 до 100 символов' });
    if (!phone)
      return res.status(400).json({ error: 'Неверный формат номера телефона' });
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 100)
      return res.status(400).json({ error: 'Пароль должен содержать от 6 до 100 символов' });
    if (!['employer', 'seeker'].includes(role))
      return res.status(400).json({ error: 'Неверная роль' });
    if (!smsCode || !/^\d{6}$/.test(String(smsCode)))
      return res.status(400).json({ error: 'Неверный формат кода' });

    // Проверяем SMS-код
    const { rows } = await db.query(
      `SELECT * FROM sms_codes WHERE phone=$1 AND expires_at > NOW()`,
      [phone]
    );
    if (!rows.length || rows[0].code !== String(smsCode))
      return res.status(400).json({ error: 'Неверный или устаревший код. Запросите SMS повторно' });

    // Проверяем что номер не занят
    const exists = await db.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (exists.rows.length)
      return res.status(400).json({ error: 'Этот номер уже зарегистрирован. Попробуйте войти' });

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users(name,phone,password,role) VALUES($1,$2,$3,$4) RETURNING id,name,phone,role,registered_at`,
      [name.trim(), phone, hash, role]
    );

    const user = result.rows[0];
    await db.query('DELETE FROM sms_codes WHERE phone=$1', [phone]);

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: rememberMe ? '30d' : '1d' });
    res.cookie('token', token, cookieOpts(rememberMe)).json({ user });
  } catch (e) { next(e); }
});

// Вход
router.post('/login', async (req, res, next) => {
  try {
    const { phone: rawPhone, password, rememberMe } = req.body;
    const phone = normalizePhone(rawPhone);

    if (!phone)
      return res.status(400).json({ error: 'Неверный формат номера телефона' });
    if (!password || typeof password !== 'string')
      return res.status(400).json({ error: 'Введите пароль' });

    const { rows } = await db.query('SELECT * FROM users WHERE phone=$1', [phone]);
    if (!rows.length)
      return res.status(400).json({ error: 'Неверный номер или пароль' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ error: 'Неверный номер или пароль' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: rememberMe ? '30d' : '1d' });
    const { password: _, ...safeUser } = user;
    res.cookie('token', token, cookieOpts(rememberMe)).json({ user: safeUser });
  } catch (e) { next(e); }
});

// Текущий пользователь
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id,name,phone,phone2,role,registered_at,avatar FROM users WHERE id=$1',
      [payload.id]
    );
    res.json({ user: rows[0] || null });
  } catch {
    res.json({ user: null });
  }
});

// Выход
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true }).json({ ok: true });
});

// Обновить профиль
router.patch('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { name, phone2, avatar } = req.body;
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100))
      return res.status(400).json({ error: 'Имя должно содержать от 2 до 100 символов' });
    const normPhone2 = phone2 !== undefined && phone2 !== '' ? normalizePhone(phone2) : '';
    if (phone2 !== undefined && phone2 !== '' && !normPhone2)
      return res.status(400).json({ error: 'Неверный формат доп. телефона' });
    if (avatar !== undefined && avatar !== null) {
      const sizeKb = (avatar.length * 3 / 4) / 1024;
      if (sizeKb > 500) return res.status(400).json({ error: 'Фото слишком большое (макс. 500 КБ)' });
    }

    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name=$${i++}`); values.push(name.trim()); }
    if (phone2 !== undefined) { updates.push(`phone2=$${i++}`); values.push(normPhone2 || ''); }
    if (avatar !== undefined) { updates.push(`avatar=$${i++}`); values.push(avatar); }
    if (!updates.length) return res.status(400).json({ error: 'Нет полей для обновления' });
    values.push(payload.id);
    const { rows } = await db.query(
      `UPDATE users SET ${updates.join(',')} WHERE id=$${i} RETURNING id,name,phone,phone2,role,registered_at,avatar`,
      values
    );
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
