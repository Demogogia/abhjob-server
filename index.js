require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // для base64 фото
app.use(cookieParser());

app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/workers', require('./src/routes/workers'));
app.use('/api/orders',  require('./src/routes/orders'));
app.use('/api/ratings', require('./src/routes/ratings'));
app.use('/api/admin',   require('./src/routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Глобальный обработчик ошибок — всегда возвращает JSON
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AbhJob server running on port ${PORT}`));
