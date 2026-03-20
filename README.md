# Portfolio Website (Next.js + Backend API + Telegram Bot)

Актуальная документация по проекту `portfolio-website` после последних изменений:
- транзакционное обновление данных в backend;
- автоэкспорт `projects/services/skills` в `Frontend/public/data`;
- webhook-интеграция Telegram-бота;
- диагностика лимитов GitHub API.

## Что внутри

- `Frontend` — сайт на Next.js (App Router), RU/EN, Tailwind.
- `Backend/api` — FastAPI для анализа GitHub-репозиториев и записи в PostgreSQL.
- `Backend/bot` — aiogram + FastAPI webhook для Telegram.
- `PostgreSQL` и `Redis` — инфраструктура backend.
- `nginx-proxy` — SSL и маршрутизация, включая `/webhook/telegram`.

## Важное правило источников данных

В проекте сознательно разделены два контура:

1. **UI-контур (frontend)**  
   Секции `Projects`, `Services`, `Skills` читают из:
   - `Frontend/public/data/projects.json`
   - `Frontend/public/data/services.json`
   - `Frontend/public/data/skills.json`

2. **Интеграционный контур (backend/db)**  
   Telegram-бот вызывает `Backend API`, который:
   - анализирует GitHub;
   - пишет в БД;
   - экспортирует свежие данные в `public/data/*.json`.

## Как работает обновление из Telegram

1. Пользователь отправляет в бота список GitHub-ссылок.
2. Бот вызывает `POST /v1/github/analyze` с `x-internal-api-key`.
3. Backend:
   - собирает данные по репозиториям из GitHub API;
   - генерирует `projects/services/skills` через OpenAI;
   - в одной транзакции заменяет данные в БД;
   - экспортирует JSON в `Frontend/public/data`.
4. Сайт сразу читает обновленные JSON.

## Транзакционная модель обновления

`/v1/github/analyze` работает атомарно:
- если анализ **успешен** — БД и JSON обновляются полностью;
- если анализ **падает** (например, GitHub rate-limit) — старые данные остаются.

То есть частичных/пустых состояний в БД после ошибки быть не должно.

## API

### Backend API (`Backend/api`, порт `8000`)

| Method | Endpoint | Назначение | Auth |
|---|---|---|---|
| `GET` | `/health` | healthcheck | нет |
| `POST` | `/v1/github/analyze` | GitHub -> AI -> DB -> static JSON export | `x-internal-api-key` |
| `GET` | `/v1/projects` | проекты из БД | нет |
| `GET` | `/v1/services` | услуги из БД | нет |
| `GET` | `/v1/skills` | навыки из БД (grouped) | нет |

### Telegram Bot (`Backend/bot`, порт `9000`)

| Method | Endpoint | Назначение | Auth |
|---|---|---|---|
| `POST` | `/webhook/telegram` | webhook от Telegram | `X-Telegram-Bot-Api-Secret-Token` |
| `GET` | `/health` | healthcheck | нет |

## Формат сообщений Telegram-бота

- При старте анализа:  
  `Принял N ссылок. Запускаю анализ.`

- После завершения:  
  `Завершил: обработано X из Y. Обновлено в БД:`
  - `Projects: ...`
  - `Services: ...`
  - `Skills: nocode=..., ai=..., automation=...`
  - `Skipped: ...` (если есть)

## ENV (обязательные)

`Backend/.env`:

- `API_INTERNAL_KEY` — общий ключ bot -> backend API.
- `TELEGRAM_BOT_TOKEN` — токен бота.
- `TELEGRAM_WEBHOOK_SECRET` — секрет webhook-заголовка.
- `BACKEND_API_URL` — обычно `http://backend-api:8000`.
- `DATABASE_URL` — подключение к PostgreSQL.
- `OPENAI_API_KEY` **или** `PROXY_BASE_URL + PROXY_API_KEY`.
- `STATIC_EXPORT_DIR` — `/shared/public/data`.
- `GITHUB_TOKEN` — настоятельно рекомендуется, иначе легко словить лимит GitHub API.

## Частые проблемы

### 1) `Ошибка API: 401 Unauthorized`

Причина: `API_INTERNAL_KEY` не совпадает между `backend-api` и `telegram-bot`.  
Решение: проверить `Backend/.env` и пересоздать bot-контейнер.

### 2) `422 No repositories were successfully analyzed`

Самая частая причина: исчерпан лимит GitHub API.  
Решение:
- задать `GITHUB_TOKEN` в `Backend/.env`;
- перезапустить `backend-api`.

### 3) Сайт не обновляется после успешного анализа

Проверить:
- backend отдал `200` на `/v1/github/analyze`;
- обновились файлы `Frontend/public/data/*.json`;
- `nextjs-app` запущен;
- браузерный кэш (hard refresh).

## Локальные команды (минимум)

```bash
# backend стек
cd /root/portfolio-website/Backend
docker compose up -d --build

# frontend app (основной compose)
cd /root/portfolio-website
docker compose -f docker-compose.yml up -d --build app
```

## Прод URL

- Сайт: `https://portfolio.hayklyvibelexy.ru`
- Webhook endpoint: `https://portfolio.hayklyvibelexy.ru/webhook/telegram`

## Примечание по n8n

Контейнеры `n8n-*` и `n8n-caddy-1` живут отдельно и не должны затрагиваться при работах с backend/portfolio.