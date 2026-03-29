-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT UNIQUE NOT NULL,
  phone2     TEXT,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'employer', -- employer | seeker | admin
  registered_at DATE DEFAULT CURRENT_DATE
);

-- Профили работников
CREATE TABLE IF NOT EXISTS workers (
  id             SERIAL PRIMARY KEY,
  posted_by      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  phone          TEXT,
  category       TEXT,
  profession     TEXT,
  gender         TEXT,
  experience     TEXT,
  city           TEXT,
  travel_cities  TEXT[], -- массив городов
  age            TEXT,
  salary         TEXT,
  salary_num     INTEGER DEFAULT 0,
  skills         TEXT,
  about          TEXT,
  photo          TEXT,   -- base64 или url
  verified       BOOLEAN DEFAULT FALSE,
  approved       BOOLEAN DEFAULT TRUE,
  photo_approved BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Услуги работников
CREATE TABLE IF NOT EXISTS services (
  id           SERIAL PRIMARY KEY,
  worker_id    INTEGER REFERENCES workers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  from_price   INTEGER,
  to_price     INTEGER,
  negotiable   BOOLEAN DEFAULT FALSE
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  worker_id          INTEGER REFERENCES workers(id) ON DELETE CASCADE,
  worker_name        TEXT,
  worker_profession  TEXT,
  worker_phone       TEXT,
  employer_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  employer_name      TEXT,
  status             TEXT DEFAULT 'active', -- active | completed
  created_at         DATE DEFAULT CURRENT_DATE,
  completed_at       DATE,
  rating_skipped     BOOLEAN DEFAULT FALSE
);

-- Оценки
CREATE TABLE IF NOT EXISTS ratings (
  id           SERIAL PRIMARY KEY,
  worker_id    INTEGER REFERENCES workers(id) ON DELETE CASCADE,
  employer_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  score        INTEGER CHECK (score BETWEEN 1 AND 5),
  created_at   DATE DEFAULT CURRENT_DATE
);

-- SMS коды (временные)
CREATE TABLE IF NOT EXISTS sms_codes (
  phone      TEXT PRIMARY KEY,
  code       TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Миграции (добавляются если колонки не существуют)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS portfolio_photos TEXT[] DEFAULT '{}';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_workers_city ON workers(city);
CREATE INDEX IF NOT EXISTS idx_workers_approved ON workers(approved);
CREATE INDEX IF NOT EXISTS idx_orders_employer ON orders(employer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_worker ON ratings(worker_id);
