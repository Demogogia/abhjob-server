const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendSms, generateCode } = require('../smsc');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
};

// Отправить SMS код
router.post('/sms/send', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Укажите телефон' });

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
    const { name, phone, password, role, smsCode } = req.body;

    // Проверяем код
    const { rows } = await db.query(
      `SELECT * FROM sms_codes WHERE phone=$1 AND expires_at > NOW()`,
      [phone]
    );
    if (!rows.length || rows[0].code !== smsCode)
      return res.status(400).json({ error: 'Неверный или устаревший код. Запросите SMS повторно' });

    // Проверяем что номер не занят
    const exists = await db.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (exists.rows.length)
      return res.status(400).json({ error: 'Этот номер уже зарегистрирован. Попробуйте войти' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users(name,phone,password,role) VALUES($1,$2,$3,$4) RETURNING id,name,phone,role,registered_at`,
      [name, phone, hash, role || 'employer']
    );

    const user = result.rows[0];
    await db.query('DELETE FROM sms_codes WHERE phone=$1', [phone]);

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS).json({ user });
  } catch (e) { next(e); }
});

// Вход
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Введите номер и пароль' });

    const { rows } = await db.query('SELECT * FROM users WHERE phone=$1', [phone]);
    if (!rows.length)
      return res.status(400).json({ error: 'Неверный номер или пароль' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ error: 'Неверный номер или пароль' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.cookie('token', token, COOKIE_OPTS).json({ user: safeUser });
  } catch (e) { next(e); }
});

// Текущий пользователь
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id,name,phone,phone2,role,registered_at FROM users WHERE id=$1',
      [payload.id]
    );
    res.json({ user: rows[0] || null });
  } catch {
    res.json({ user: null });
  }
});

// Выход
router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ ok: true });
});

// Обновить профиль
router.patch('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { name, phone2 } = req.body;
    const { rows } = await db.query(
      'UPDATE users SET name=$1, phone2=$2 WHERE id=$3 RETURNING id,name,phone,phone2,role,registered_at',
      [name, phone2, payload.id]
    );
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
