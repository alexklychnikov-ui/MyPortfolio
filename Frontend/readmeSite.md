# AI-агент: Анализ Frontend-проекта (Портфолио No-Code Разработчика)

## 📋 Общее Описание

**Тип проекта:** Персональный сайт-портфолио No-Code разработчика ("VibeCode")

**Назначение:** Демонстрация навыков, проектов и услуг No-Code разработки с фокусом на:
- Быстрая разработка MVP
- Автоматизация бизнес-процессов
- Интеграция AI-решений

**URL/Местоположение:** Папка `Frontend/`

---

## 🏗️ Архитектура и Технологии

### Фреймворк и Рендеринг
- **Платформа:** Next.js 16.1.6 (App Router)
- **Версия React:** 19
- **Рендеринг:** Client Components (`"use client"`)
- **Стилизация:** Tailwind CSS 3.4 + кастомный CSS (portfolio.css)
- **Шрифт:** Inter (Google Fonts via next/font/google)

### UI Компоненты
- **Библиотека UI:** shadcn/ui (Radix UI primitives)
- **Иконки:** Lucide React
- **Анимации:** Tailwind CSS Animate
- **Карусель:** Embla Carousel React
- **Уведомления:** Sonner / Toast
- **Графики:** Recharts
- **Формы:** React Hook Form + Zod

### Управление Состоянием и i18n
- **Локализация:** Кастомный i18n провайдер (`components/portfolio/i18n.tsx`)
- **Поддержка языков:** EN, RU (переключатель в навбаре)
- **Утилиты:** clsx, tailwind-merge, class-variance-authority (CVA)

### Конфигурация
- **TypeScript:** 5.7.3 (строгий режим, но ignoreBuildErrors: true в next.config)
- **Lint:** ESLint
- **PostCSS:** с @tailwindcss/postcss
- **Изображения:** Не оптимизированы (unoptimized: true в next.config)

---

## 📁 Структура Файлов

```
Frontend/
├── app/
│   ├── layout.tsx           # Root layout (метаданные, viewport)
│   ├── page.tsx             # Главная страница
│   ├── globals.css          # Tailwind + CSS переменные
│   └── portfolio.css        # Кастомные стили портфолио
├── components/
│   ├── portfolio/           # Компоненты секций портфолио
│   │   ├── Hero.tsx         # Секция "Обо мне" + фото
│   │   ├── Navbar.tsx       # Навигация + переключатель языка
│   │   ├── Skills.tsx       # Навыки (табы: No-Code, AI, Automation)
│   │   ├── Projects.tsx     # Портфолио проектов (сетка 3 колонки)
│   │   ├── Services.tsx     # Услуги (3 карточки)
│   │   ├── Testimonials.tsx # Отзывы (горизонтальный скролл)
│   │   ├── Contact.tsx      # Форма контактов + инфо
│   │   └── i18n.tsx         # Локализация (RU/EN)
│   └── ui/                  # shadcn/ui компоненты (40+ файлов)
├── hooks/
│   ├── use-mobile.tsx       # Хук определения мобильного устройства
│   └── use-toast.ts         # Хук для уведомлений
├── lib/
│   └── utils.ts             # Утилиты (cn = clsx + tailwind-merge)
├── public/
│   └── assets/profile.jpg   # Фото профиля (340x340px)
├── package.json
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── postcss.config.mjs
```

---

## 🎨 Дизайн и UI/UX

### Цветовая Палитра (CSS Variables)
```css
--color-bg: #f5f7fa           /* Фон */
--color-surface: #ffffff      /* Поверхности */
--color-text: #1a1d23         /* Основной текст */
--color-text-secondary: #5a6170 /* Вторичный текст */
--color-primary: #2563eb      /* Акцент (синий) */
--color-accent: #0d9488       /* Доп. акцент (зеленый) */
--color-border: #e2e6ed       /* Границы */
--color-badge-bg: #eef2ff     /* Фон бейджей */
--color-badge-text: #3b5bdb   /* Текст бейджей */
```

### Секции Страницы (порядок сверху вниз)
1. **Navbar** — фиксированная навигация с переключателем языков
2. **Hero** — заголовок, описание, список преимуществ, CTA-кнопки, фото
3. **Skills** — 3 таба (No-Code, AI/API, Automation) с бейджами инструментов
4. **Projects** — 6 карточек проектов с тегами технологий
5. **Services** — 3 карточки услуг с иконками
6. **Testimonials** — 4 отзыва с горизонтальной прокруткой
7. **Contact** — контактная информация + форма
8. **Footer** — копирайт

### Адаптивность (Breakpoints)
- **Desktop (>900px):** 2 колонки в Hero, 3 колонки в Projects/Services
- **Tablet (640-900px):** 2 колонки в Projects/Services
- **Mobile (<640px):** 1 колонка, мобильное меню-бургер

### Анимации
- `accordion-down/up` — для Radix UI компонентов
- Hover-эффекты на карточки и кнопки
- Плавные переходы (0.3s ease)

---

## 🔧 Ключевые Компоненты

### Hero.tsx
```typescript
// use client
- Заголовок: "VibeCode / No-Code Developer"
// Список преимуществ (3 пункта)
// Кнопки: "View Projects" + "Contact Me"
// Фото: /assets/profile.jpg (340x340, border-radius: 50%)
```

### Navbar.tsx
```typescript
// use client
- Фиксированная позиция при скролле (scrolled class)
// Переключатель языков RU/EN (state: locale)
// Мобильное меню (hamburger toggle)
// Ссылки на секции: #skills, #projects, #services, #testimonials, #contact
```

### Skills.tsx
```typescript
// use client, useState для табов
// 3 таба:
- No-Code: Lovable, Bubble, Webflow, Framer, Airtable, Notion
- AI / API: OpenAI API, Cursor, Claude API, LangChain, Pinecone, Supabase
- Automation: Make, n8n, Zapier, Telegram Bots, Webhooks, Cron Jobs
```

### Projects.tsx
```typescript
// use client
- 6 проектов с описанием и стеком технологий:
1. AI Customer Support Bot (OpenAI, n8n, Telegram, Supabase)
2. E-Commerce MVP (Lovable, Stripe, Make, Airtable)
3. Lead Gen Automation (Zapier, Clay, Airtable, Webhooks)
4. SaaS Dashboard (Cursor, Supabase, OpenAI, Framer)
5. Booking Platform (Bubble, Stripe, Zapier, Cal.com)
6. Content Workflow Engine (n8n, OpenAI, Webflow, Buffer)
```

### Services.tsx
```typescript
// use client
- 3 услуги:
1. MVP Development — быстрые MVP с авторизацией, платежами, интеграциями
2. Workflow Automation — автоматизация процессов,连接工具
3. AI Integration — чат-боты, генерация контента, анализ данных
```

### Testimonials.tsx
```typescript
// use client, useRef для скролла
- 4 отзыва от клиентов (основатели, CTO, Product Lead)
- Горизонтальный скролл с кнопками навигации
- 5-звездочный рейтинг
```

### Contact.tsx
```typescript
// use client
- Информация: email, локация, время ответа
- Форма: name, email, message (нативный HTML form)
- aria-labels для доступности
```

### i18n.tsx
```typescript
// use client, createContext, useState
// Полная локализация всех текстов на EN и RU
// Функция useI18n() для доступа к переводам
// Структура: t.[section].[key][locale]
```

---

## 📦 Зависимости (package.json)

### Core
- `next: 16.1.6`
- `react: ^19`, `react-dom: ^19`

### UI (Radix UI)
- `@radix-ui/react-*` (accordion, dialog, dropdown, tabs, toast, tooltip, etc.)
- `class-variance-authority`, `clsx`, `tailwind-merge`

### Формы и Валидация
- `react-hook-form`, `zod`, `@hookform/resolvers`

### AI и Данные
- `openai`, `langchain`, `recharts`

### Утилиты
- `lucide-react` (иконки), `date-fns`, `embla-carousel-react`

---

## 🚀 Скрипты

```bash
npm run dev      # Запуск dev-сервера
npm run build    # Production сборка
npm run start    # Запуск production сервера
npm run lint     # ESLint проверка
```

---

## ⚙️ Конфигурация

### next.config.mjs
```javascript
typescript: { ignoreBuildErrors: true }
images: { unoptimized: true }
```

### tailwind.config.ts
- Dark mode: ['class']
- Кастомные цвета (background, foreground, primary, chart, sidebar)
- Кастомные анимации (accordion-down/up)
- Плагин: tailwindcss-animate

---

## 🎯 Ключевые Особенности для AI-Агента

1. **Full-stack Next.js** с App Router и клиентскими компонентами
2. **Двуязычность** (EN/RU) через контекст без внешних библиотек
3. **shadcn/ui** как основа UI — компоненты из `components/ui/`
4. **Tailwind CSS** + кастомный CSS для специфичных стилей
5. **Адаптивный дизайн** — 3 брейкпоинта
6. **ARIA-доступность** — роли tablist, tab, tabpanel, aria-labels
7. **Анимации** — hover-эффекты, скролл, переходы
8. **Структура портфолио** — 7 секций с конкретным контентом

---

## 🔍 Файлы для Изменения Контента

| Задача | Файл |
|--------|------|
| Изменить тексты (EN/RU) | `components/portfolio/i18n.tsx` |
| Изменить стили | `app/portfolio.css` |
| Изменить проекты | `components/portfolio/Projects.tsx` + `i18n.tsx` |
| Изменить навыки | `components/portfolio/Skills.tsx` |
| Изменить услуги | `components/portfolio/Services.tsx` + `i18n.tsx` |
| Изменить отзывы | `components/portfolio/Testimonials.tsx` + `i18n.tsx` |
| Изменить контактные данные | `components/portfolio/Contact.tsx` + `i18n.tsx` |
| Заменить фото профиля | `public/assets/profile.jpg` |
| Изменить метаданные | `app/layout.tsx` (metadata, title, description) |

---

## 📌 Важные Замечания

1. **ignoreBuildErrors: true** — TypeScript ошибки не блокируют сборку
2. **Изображения не оптимизированы** — next/image использует unoptimized
3. **Форма контакта** — нативный HTML form без обработчика (action="#")
4. **Нет backend** — статический сайт, все данные в коде
5. **CSS переменные** — используются в portfolio.css, не в tailwind.config
6. **Контекст i18n** — оборачивает всю страницу в `I18nProvider`
7. **Мобильное меню** — появляется при клике на бургер, скрыто по умолчанию
