require('dotenv').config();

// Проверяем критичные переменные при старте
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET не задан в переменных окружения');
if (!process.env.CLIENT_URL) throw new Error('CLIENT_URL не задан в переменных окружения');

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.set('trust proxy', 1); // Railway сидит за reverse proxy

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '3mb' })); // для base64 фото, но не бесконечно
app.use(cookieParser());

// Rate limit на SMS — не более 3 запросов в час с одного IP
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Слишком много SMS-запросов. Попробуйте через час.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit на вход — не более 10 попыток за 15 минут с одного IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Слишком много попыток входа. Подождите 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов к админ-панели.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/sms/send', smsLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/admin', adminLimiter);

app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/workers', require('./src/routes/workers'));
app.use('/api/orders',  require('./src/routes/orders'));
app.use('/api/ratings', require('./src/routes/ratings'));
app.use('/api/admin',   require('./src/routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Глобальный обработчик ошибок — всегда возвращает JSON
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const db = require('./src/db');
const PORT = process.env.PORT || 3000;

async function start() {
  // Авто-миграции
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT');
  await db.query("ALTER TABLE workers ADD COLUMN IF NOT EXISTS portfolio_photos TEXT[] DEFAULT '{}'");
  app.listen(PORT, () => console.log(`AbhJob server running on port ${PORT}`));
}
start().catch(e => { console.error('Startup error:', e.message); process.exit(1); });
