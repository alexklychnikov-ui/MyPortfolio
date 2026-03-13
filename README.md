# Александр Клычников — No-Code & AI Разработчик

Персональный сайт-портфолио разработчика с демонстрацией навыков, проектов и услуг в области быстрой разработки MVP, автоматизации бизнес-процессов и интеграции AI-решений.

## 🚀 Демо

Портфолио включает:

- **Навыки**: No-Code инструменты, AI/API интеграции, автоматизация процессов
- **Проекты**: 5 готовых решений на базе Python, Telegram Bots и AI
- **Услуги**: MVP разработка, автоматизация рабочих процессов, AI интеграция
- **Отзывы**: Рекомендации от клиентов и партнеров
- **Контакты**: Форма обратной связи, email и Telegram

## 🏗️ Технологии

### Core
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19
- **TypeScript**: 5.7.3
- **Styling**: Tailwind CSS 3.4 + кастомный CSS

### UI Components
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animate
- **Carousel**: Embla Carousel React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Features
- **i18n**: Двуязычность (RU/EN) через кастомный провайдер
- **Responsive**: Адаптивный дизайн (Desktop, Tablet, Mobile)
- **Accessibility**: ARIA-метки и семантическая разметка
- **Backend API**: контактная форма, отзывы, GitHub -> AI генерация, чтение данных из БД
- **Telegram Integration**: отдельный bot-service через webhook

## 📁 Структура проекта

```
Frontend/
├── app/
│   ├── layout.tsx           # Root layout с метаданными
│   ├── page.tsx            # Главная страница
│   ├── globals.css          # Tailwind стили
│   └── portfolio.css        # Кастомные стили портфолио
├── components/
│   ├── portfolio/           # Компоненты портфолио
│   │   ├── Hero.tsx         # Секция "Обо мне"
│   │   ├── Navbar.tsx       # Навигация
│   │   ├── Skills.tsx       # Навыки (табы)
│   │   ├── Projects.tsx     # Портфолио проектов
│   │   ├── Services.tsx     # Услуги
│   │   ├── Testimonials.tsx # Отзывы
│   │   ├── Contact.tsx      # Контакты
│   │   └── i18n.tsx         # Локализация
│   └── ui/                  # shadcn/ui компоненты
├── hooks/                   # React хуки
├── lib/                     # Утилиты
└── public/                  # Статические файлы
    ├── data/                # JSON данные
    │   ├── projects.json    # Проекты
    │   ├── services.json    # Услуги
    │   └── testimonials.json # Отзывы
    └── assets/              # Изображения и статика
```

## 🛠️ Установка и запуск

### Предварительные требования
- Node.js 18+ 
- npm или pnpm

### Установка зависимостей

```bash
# С использованием npm
npm install

# С использованием pnpm
pnpm install
```

### Запуск в режиме разработки

```bash
# npm
npm run dev

# pnpm  
pnpm dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## 🔌 API Endpoints

### Frontend API (Next.js, порт 3000)

| Method | Endpoint | Описание | Auth |
|--------|----------|----------|------|
| `GET` | `/api/health` | Проверка состояния frontend API | Нет |
| `POST` | `/api/contact` | Отправка contact form, запись в БД, отправка в email/Telegram | Нет (rate limit) |
| `GET` | `/api/testimonials` | Получить только одобренные отзывы | Нет |
| `POST` | `/api/testimonials` | Создать отзыв (pending moderation) | Нет (rate limit) |
| `GET` | `/api/testimonials/pending` | Список отзывов на модерации | `x-moderation-key` / `Authorization: Bearer` |
| `POST` | `/api/testimonials/moderate` | Одобрить/отклонить отзыв | `x-moderation-key` / `Authorization: Bearer` |
| `POST` | `/api/github/analyze` | GitHub -> AI -> DB (projects/services/skills) | `x-telegram-bot-key` / `Authorization: Bearer` |
| `GET` | `/api/projects` | Список projects из БД | Нет |
| `GET` | `/api/services` | Список services из БД | Нет |
| `GET` | `/api/skills` | Список skills из БД (grouped) | Нет |

### Backend API (FastAPI, порт 8000, `Backend/api`)

| Method | Endpoint | Описание | Auth |
|--------|----------|----------|------|
| `GET` | `/health` | Health check backend-api | Нет |
| `POST` | `/v1/github/analyze` | GitHub -> AI -> PostgreSQL | `x-internal-api-key` |
| `GET` | `/v1/projects` | Список projects из PostgreSQL | Нет |
| `GET` | `/v1/services` | Список services из PostgreSQL | Нет |
| `GET` | `/v1/skills` | Список skills из PostgreSQL (grouped) | Нет |

### Telegram Bot Service (aiogram + FastAPI, порт 9000, `Backend/bot`)

| Method | Endpoint | Описание | Auth |
|--------|----------|----------|------|
| `POST` | `/webhook/telegram` | Webhook от Telegram, обработка сообщений с GitHub URL | `X-Telegram-Bot-Api-Secret-Token` |
| `GET` | `/health` | Health check bot-service | Нет |

### Сборка для продакшена

```bash
# Сборка
npm run build

# Запуск продакшен версии
npm run start

# Проверка кода линтером
npm run lint
```

## 🎨 Секции портфолио

### 1. Hero
- Заголовок и описание
- Приветствие на русском и английском
- CTA кнопки
- Фото профиля

### 2. Skills
- **No-Code**: Lovable, Bubble, Webflow, Framer, Airtable, Notion
- **AI / API**: OpenAI API, Cursor, Claude API, LangChain, Pinecone, Supabase  
- **Automation**: Make, n8n, Zapier, Telegram Bots, Webhooks, Cron Jobs

### 3. Projects
5 готовых проектов:

1. **Telegram-бот с короткой и долгой памятью**
   - Python, Telegram Bot API, SQLite, asyncio
   - Хранение контекста диалогов с in-memory и SQLite памятью

2. **Унифицированный Telegram-бот для ведения личных расходов**
   - Python, Telegram Bot API, SQLite, aiogram
   - Учет финансов, категории, отчеты и статистика

3. **Генератор сайт-портфолио на базе LangChain**
   - Python, LangChain, OpenAI API, Streamlit
   - Автоматическая генерация портфолио из описания навыков

4. **Telegram-бот для получения информации о погоде**
   - Python, Telegram Bot API, OpenWeatherMap API
   - Актуальная погода по городам

5. **Dynamics AX X++ Development Assistant**
   - Python, OpenAI API, X++ snippets, VS Code extension
   - AI-ассистент для разработки на X++ в Microsoft Dynamics AX

### 4. Services
- **MVP Development** — быстрые MVP с авторизацией и платежами
- **Workflow Automation** — автоматизация бизнес-процессов
- **AI Integration** — чат-боты и генерация контента

### 5. Testimonials
Заглушка с возможностью добавления отзывов через JSON

### 6. Contact
- Email: alexandr_klychnikov@mail.ru
- Telegram: Alexandr_Kl
- Время ответа: в течение 12 часов
- Форма обратной связи

## 🌐 Локализация

Поддерживается два языка:
- 🇷🇺 Русский (RU)
- 🇺🇸 English (EN)

Переключение языков осуществляется через переключатель в навигации.

## 📱 Адаптивность

- **Desktop** (>900px): 2 колонки в Hero, 3 колонки в Projects/Services
- **Tablet** (640-900px): 2 колонки в Projects/Services  
- **Mobile** (<640px): 1 колонка, мобильное меню

## 🎨 Цветовая палитра

```css
--color-bg: #f5f7fa           /* Фон */
--color-surface: #ffffff      /* Поверхности */
--color-text: #1a1d23         /* Основной текст */
--color-text-secondary: #5a6170 /* Вторичный текст */
--color-primary: #2563eb      /* Акцент (синий) */
--color-accent: #0d9488       /* Доп. акцент (зеленый) */
```

## 🔧 Настройка

### Изменение контента

| Задача | Файл |
|--------|------|
| Тексты (RU/EN) | `components/portfolio/i18n.tsx` |
| Проекты | `public/data/projects.json` |
| Навыки | `components/portfolio/Skills.tsx` |
| Услуги | `public/data/services.json` |
| Отзывы | `public/data/testimonials.json` |
| Контакты | `components/portfolio/Contact.tsx` |
| Стили | `app/portfolio.css` |
| Фото профиля | `public/assets/profile.jpg` |
| Метаданные | `app/layout.tsx` |

### Конфигурация

**next.config.mjs**
```javascript
typescript: { ignoreBuildErrors: true }
images: { unoptimized: true }
```

**tailwind.config.ts**
- Dark mode: `['class']`
- Кастомные цвета и анимации
- Плагин: `tailwindcss-animate`

## 📋 Скрипты

```bash
npm run dev      # Dev сервер
npm run build    # Production сборка
npm run start    # Запуск продакшена
npm run lint     # ESLint проверка
```

## 📌 Особенности

- ✅ TypeScript с ignoreBuildErrors (ошибки не блокируют сборку)
- ✅ Неоптимизированные изображения (unoptimized: true)
- ✅ Контактная форма и отзывы через API
- ✅ GitHub -> AI -> DB генерация projects/services/skills
- ✅ CSS переменные в portfolio.css
- ✅ i18n контекст оборачивает всю страницу
- ✅ Мобильное меню с бургером
- ✅ Динамическая загрузка данных через API/БД

## 🤝 Вклад в проект

Проект создан как персональное портфолио. Для внесения изменений:

1. Форкните репозиторий
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

Этот проект создан для демонстрации навыков No-Code и AI разработки.

---

**Александр Клычников** — Быстрая разработка MVP, автоматизация процессов, AI интеграции 🚀

**Контакты:**
- Email: alexandr_klychnikov@mail.ru
- Telegram: @Alexandr_Kl