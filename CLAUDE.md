# АбхДжоб — контекст проекта

## Стек
- **Фронтенд**: React + Vite, папка `C:/Users/Admin/rabota-ryadom/`
- **Бэкенд**: Railway → `https://abhjob-server-production.up.railway.app`
- **GitHub**: https://github.com/Demogogia/abhjob-server (ветка `main`)
- **Домен**: `abhjob.ru` (куплен на reg.ru)

## Хостинг
- Фронтенд на **Cloudflare Workers**
- Рабочий URL: `fragrant-wildflower-065f.gogiademo.workers.dev`
- Перешли с Netlify — кончились бесплатные деплои

## Статус домена
NS-серверы на reg.ru изменены на Cloudflare:
- `asa.ns.cloudflare.com`
- `harley.ns.cloudflare.com`

**Домен подключён и работает** — abhjob.ru открывается через Cloudflare Workers. ✓

## Что было сделано (аудит)
- Тихие ошибки → toast уведомления везде
- `alert()` → визуальная кнопка "Скопировано ✓"
- Error Boundary в `main.jsx`
- Favicon 💼 + мета-теги SEO в `index.html`
- Loading states на всех кнопках форм
- Debounce 300мс на поиск + `useMemo` для фильтра/сортировки
- Бандл уменьшен с 623 КБ до 341 КБ (xlsx — lazy import)
- Удалён мёртвый код, неиспользуемые иконки
- Cleanup таймера SMS при размонтировании
