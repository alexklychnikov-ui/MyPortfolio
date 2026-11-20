import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"

type Locale = "en" | "ru"

const translations = {
  hero: {
    label: {
      en: "Python / AI · automation",
      ru: "Python / AI · автоматизация",
    },
    namePrimary: {
      en: "Alexander Klychnikov",
      ru: "Клычников Александр",
    },
    nameSecondary: {
      en: "Klychnikov Alexander",
      ru: "Александр Клычников",
    },
    title: {
      en: "VibeCode",
      ru: "VibeCode",
    },
    outcome: {
      en: "One scenario → bot, RAG or API → deploy",
      ru: "Один сценарий → бот, RAG или API → деплой",
    },
    taglinePrimary: {
      en: "One scenario → bot, RAG or API → deploy",
      ru: "Один сценарий → бот, RAG или API → деплой",
    },
    taglineSecondary: {
      en: "Telegram · RAG · integrations · a working contour",
      ru: "Telegram · RAG · интеграции · рабочий контур",
    },
    subtitle: {
      en: "ERP background, 10+ years. I ship Python, AI and Telegram to production — with a handoff note, not a slide deck.",
      ru: "ERP-бэкграунд, 10+ лет. Собираю Python, AI и Telegram до продакшена — с инструкцией, не с презентацией.",
    },
    description: {
      en: "I take one business flow to a working contour: deploy, handoff, a clear done criterion.",
      ru: "Довожу один бизнес-поток до рабочего контура: деплой, инструкция, понятный критерий «готово».",
    },
    chipsAria: { en: "Availability", ru: "Доступность" },
    chips: {
      en: ["Open to projects", "Remote", "Scenario review in 24h"],
      ru: ["Открыт к проектам", "Удалённо", "Разбор сценария за 24ч"],
    },
    benefits: {
      en: [
        "Telegram bot for one process: request → status → person / CRM",
        "AI & RAG pilot: docs or Excel → answer in chat",
        "One integration contour: API, statuses, journal — then deploy",
      ],
      ru: [
        "Telegram-бот под один процесс: заявка → статус → человек / CRM",
        "AI и RAG-пилот: документы или Excel → ответ в чате",
        "Один контур интеграции: API, статусы, журнал — и деплой",
      ],
    },
    cta: {
      primary: { en: "Send a scenario", ru: "Прислать сценарий" },
      secondary: { en: "View projects", ru: "Смотреть проекты" },
    },
    photoAlt: {
      en: "Alexander Klychnikov — Python / AI developer, profile photo",
      ru: "Клычников Александр — Python / AI-разработчик, фото профиля",
    },
  },
  utility: {
    ariaLabel: { en: "Quick contacts", ru: "Быстрые контакты" },
    telegram: { en: "Open Telegram", ru: "Открыть Telegram" },
    email: { en: "Write email", ru: "Написать на почту" },
    copy: { en: "Copy", ru: "Копировать" },
    copyEmail: { en: "Copy email", ru: "Скопировать email" },
    copied: { en: "Email copied", ru: "Email скопирован" },
    copiedShort: { en: "Copied", ru: "Скопировано" },
    copyFailed: { en: "Could not copy", ru: "Не удалось скопировать" },
  },
  skills: {
    label: { en: "Expertise", ru: "Экспертиза" },
    title: { en: "Skills & Technologies", ru: "Навыки и технологии" },
    subtitle: {
      en: "The stack I use to take a bot, a RAG base or an integration through to deploy.",
      ru: "Стек, которым закрываю бота, RAG или интеграцию до деплоя.",
    },
    tabLanguageRuntime: { en: "Languages & runtime", ru: "Языки и runtime" },
    tabAILLM: { en: "AI / LLM", ru: "AI / LLM" },
    tabBackend: { en: "Backend", ru: "Backend" },
    tabBotsIntegrations: { en: "Bots & integrations", ru: "Боты и интеграции" },
    tabInfrastructure: { en: "Infrastructure", ru: "Инфраструктура" },
    tabAutomation: { en: "Automation", ru: "Автоматизация" },
    tabDevTools: { en: "Development tools", ru: "Инструменты разработки" },
    ariaLabel: { en: "Skills categories", ru: "Категории навыков" },
  },
  projects: {
    label: { en: "Portfolio", ru: "Портфолио" },
    title: { en: "Featured Projects", ru: "Избранные проекты" },
    subtitle: {
      en: "Problem → solution → stack → result → demo / GitHub. Clear in 30 seconds.",
      ru: "Проблема → решение → стек → результат → демо / GitHub. Понятно за 30 секунд.",
    },
    loading: { en: "Loading projects...", ru: "Загрузка проектов..." },
    fields: {
      goal: { en: "Task", ru: "Задача" },
      role: { en: "Who it's for", ru: "Кому" },
      result: { en: "Result", ru: "Результат" },
    },
    links: {
      github: { en: "GitHub", ru: "GitHub" },
      demo: { en: "Live demo", ru: "Демо" },
      media: { en: "Screens & video", ru: "Скрины и видео" },
    },
    liveBadge: { en: "Live demo", ru: "Live demo" },
    trustChip: {
      en: "Open demos & repos",
      ru: "Открытые демо и репозитории",
    },
    media: {
      screenshots: { en: "Screenshots", ru: "Скриншоты" },
      videos: { en: "Videos", ru: "Видео" },
      zoom: { en: "Enlarge screenshot", ru: "Увеличить скриншот" },
      zoomOut: { en: "Back to normal size", ru: "Вернуть обычный размер" },
      videoError: {
        en: "Browser cannot play this file.",
        ru: "Браузер не смог проиграть файл.",
      },
      openFile: { en: "Open file", ru: "Открыть файл" },
    },
    cta: {
      title: {
        en: "Need a similar contour?",
        ru: "Нужен похожий контур?",
      },
      contact: { en: "Send your scenario", ru: "Прислать сценарий" },
      github: { en: "All repositories", ru: "Все репозитории" },
    },
  },
  services: {
    label: { en: "What I Offer", ru: "Что предлагаю" },
    title: { en: "Services", ru: "Услуги" },
    subtitle: {
      en: "Three clear scopes for SMB — price is «from» for one contour to deploy, not an endless discovery.",
      ru: "Три понятных объёма для МСБ — цена «от» за один контур до деплоя, не бесконечный discovery.",
    },
    items: {
      en: [
        { title: "Telegram bots for a process", description: "One flow: request → status → manager/CRM. «From» = one-scenario MVP through deploy." },
        { title: "AI and RAG for the job", description: "Docs or Excel → knowledge base → answer in chat. «From» = pilot on one data corpus." },
        { title: "Integrations with status", description: "One Telegram ↔ CRM ↔ sheets ↔ API link. «From» = one contour with journal and handoff." },
      ],
      ru: [
        { title: "Telegram-боты под процесс", description: "Один поток: заявка → статус → менеджер/CRM. «От» = MVP одного сценария до деплоя." },
        { title: "AI и RAG под задачу", description: "Документы или Excel → база знаний → ответ в чате. «От» = пилот на одном корпусе." },
        { title: "Интеграции со статусом", description: "Одна связка Telegram ↔ CRM ↔ таблицы ↔ API. «От» = один контур с журналом и инструкцией." },
      ],
    },
    discuss: { en: "Discuss this scope", ru: "Обсудить этот объём" },
  },
  testimonials: {
    label: { en: "Feedback", ru: "Отзывы" },
    title: { en: "What Clients Say", ru: "Что говорят клиенты" },
    subtitle: {
      en: "Feedback from people who shipped a working contour with me.",
      ru: "Отзывы тех, с кем довели задачу до рабочего контура.",
    },
    starRating: { en: "5 star rating", ru: "Оценка 5 звёзд" },
    scrollLeft: { en: "Scroll testimonials left", ru: "Прокрутить отзывы влево" },
    scrollRight: { en: "Scroll testimonials right", ru: "Прокрутить отзывы вправо" },
    noTestimonials: { 
      en: "No information in this section yet",
      ru: "В этом разделе пока нет информации",
    },
    addTestimonial: { 
      en: "Add Testimonial", 
      ru: "Добавить отзыв" 
    },
    formTaskLabel: { en: "What task was implemented?", ru: "Какую задачу реализовывали?" },
    formImpressionsLabel: { en: "Your impressions of the result", ru: "Впечатления от реализации" },
    formAuthorLabel: { en: "Your name", ru: "Ваше имя" },
    formRoleLabel: { en: "Role / Company (optional)", ru: "Роль / компания (опционально)" },
    formRatingLabel: { en: "Rating", ru: "Оценка" },
    formSubmit: { en: "Submit review", ru: "Отправить отзыв" },
    formSending: { en: "Sending...", ru: "Отправка..." },
    formSuccess: { en: "Thank you! Your review is under moderation.", ru: "Спасибо! Отзыв на модерации." },
    formError: { en: "Failed to send. Try again later.", ru: "Не удалось отправить. Попробуйте позже." },
    modalClose: { en: "Close", ru: "Закрыть" },
  },
  contact: {
    label: { en: "Get In Touch", ru: "Связь" },
    title: { en: "Send a scenario", ru: "Пришлите сценарий" },
    subtitle: {
      en: "One flow is enough: who starts it, what should happen, what counts as done. Free review within 24h.",
      ru: "Достаточно одного потока: кто запускает, что должно произойти, что считается «готово». Бесплатный разбор за 24ч.",
    },
    infoTitle: {
      en: "Free scenario review in 24h",
      ru: "Бесплатный разбор сценария за 24ч",
    },
    infoText: {
      en: "Bot, AI/RAG or integration — write the flow. I get a Telegram ping and reply within 24h with architecture options and a concrete next step, not a vague «let's chat».",
      ru: "Бот, AI/RAG или интеграция — опишите поток. Пинг в Telegram, ответ за 24ч: варианты архитектуры и конкретный следующий шаг, не «давайте созвонимся» в вакууме.",
    },
    email: "alexandr_klychnikov@mail.ru",
    location: { en: "Irkutsk · remote", ru: "Иркутск · удалённо" },
    responseTime: {
      en: "Scenario review within 24h",
      ru: "Разбор сценария за 24ч",
    },
    replySla: {
      en: "Reply within 24h",
      ru: "Ответ за 24ч",
    },
    telegram: {
      en: "Telegram contact",
      ru: "Telegram-контакт",
    },
    telegramUsername: "Alex_Assistant_freelancing_bot",
    telegramButton: { en: "Open Telegram", ru: "Открыть Telegram" },
    telegramOpenAppHint: {
      en: "Opens Telegram app directly.",
      ru: "Откроется приложение Telegram.",
    },
    quickConnectLabel: { en: "Quick contact", ru: "Связь в Telegram" },
    nameLabel: { en: "Name", ru: "Имя" },
    namePlaceholder: { en: "Your name", ru: "Ваше имя" },
    emailLabel: { en: "Email", ru: "Эл. почта" },
    emailPlaceholder: { en: "you@example.com", ru: "you@example.com" },
    phoneLabel: { en: "Phone", ru: "Телефон" },
    phonePlaceholder: { en: "+7 (999) 123-45-67", ru: "+7 (999) 123-45-67" },
    messageLabel: { en: "Scenario", ru: "Сценарий" },
    messagePlaceholder: {
      en: "Trigger → steps → done criterion…",
      ru: "Триггер → шаги → критерий «готово»…",
    },
    sendButton: { en: "Send for 24h review", ru: "Отправить на разбор за 24ч" },
    formAriaLabel: { en: "Contact form", ru: "Форма связи" },
    sending: { en: "Sending...", ru: "Отправка..." },
    success: {
      en: "Got it. I'll review the scenario within 24h.",
      ru: "Принял. Разберу сценарий в течение 24ч.",
    },
    error: { en: "Failed to send. Try again or write via Telegram.", ru: "Не удалось отправить. Попробуйте ещё раз или напишите в Telegram." },
  },
  footer: {
    copyright: {
      en: "Alexander Klychnikov",
      ru: "Клычников Александр",
    },
    text: {
      en: "Python, AI and Telegram — one scenario to a working contour. Irkutsk · remote.",
      ru: "Python, AI и Telegram — один сценарий до рабочего контура. Иркутск · удалённо.",
    },
  },
  nav: {
    skills: { en: "Skills", ru: "Навыки" },
    projects: { en: "Projects", ru: "Проекты" },
    services: { en: "Services", ru: "Услуги" },
    testimonials: { en: "Testimonials", ru: "Отзывы" },
    contact: { en: "Contact", ru: "Контакты" },
  },
  langSwitch: {
    toggleLabel: { en: "Switch to Russian", ru: "Переключить на английский" },
    navAriaLabel: { en: "Main navigation", ru: "Главная навигация" },
    menuAriaLabel: { en: "Toggle navigation menu", ru: "Открыть/закрыть меню" },
  },
  a11y: {
    skipLink: { en: "Skip to content", ru: "Перейти к содержимому" },
  },
} as const

type Translations = typeof translations

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ru")

  const value: I18nContextValue = {
    locale,
    setLocale: useCallback((l: Locale) => setLocale(l), []),
    t: translations,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}