import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"

type Locale = "en" | "ru"

const translations = {
  hero: {
    label: { en: "No-Code Developer", ru: "No-Code Разработчик" },
    title: {
      en: "VibeCode",
      ru: "VibeCode",
    },
    subtitle: {
      en: "No-Code Developer",
      ru: "No-Code Разработчик",
    },
    description: {
      en: "I turn ideas into working products in days, not months. Specializing in rapid MVP development, AI integrations, and workflow automation.",
      ru: "Превращаю идеи в работающие продукты за дни, а не месяцы. Специализируюсь на быстрой разработке MVP, интеграции AI и автоматизации процессов.",
    },
    benefits: {
      en: [
        "Rapid MVP development",
        "AI & automation integration", 
        "No-code & low-code tools"
      ],
      ru: [
        "Быстрая разработка MVP",
        "Интеграция AI и автоматизация",
        "No-code и low-code инструменты"
      ],
    },
    cta: {
      primary: { en: "View Projects", ru: "Посмотреть проекты" },
      secondary: { en: "Contact Me", ru: "Связаться" },
    },
    photoAlt: { en: "Developer profile photo", ru: "Фото разработчика" },
  },
  skills: {
    label: { en: "Expertise", ru: "Экспертиза" },
    title: { en: "Skills & Technologies", ru: "Навыки и технологии" },
    subtitle: {
      en: "Tools and technologies I use for fast and reliable development.",
      ru: "Инструменты и технологии, которые я использую для быстрой и надёжной разработки.",
    },
    tabNoCode: { en: "No-Code", ru: "No-Code" },
    tabAI: { en: "AI / API", ru: "AI / API" },
    tabAutomation: { en: "Automation", ru: "Автоматизация" },
    ariaLabel: { en: "Skills categories", ru: "Категории навыков" },
  },
  projects: {
    label: { en: "Portfolio", ru: "Портфолио" },
    title: { en: "Featured Projects", ru: "Избранные проекты" },
    subtitle: {
      en: "A selection of products and automations built with modern no-code tools and AI integrations.",
      ru: "Подборка продуктов и автоматизаций, созданных с помощью современных no-code инструментов и AI.",
    },
    items: {
      en: [
        {
          title: "AI Customer Support Bot",
          description: "Automated support system using OpenAI API integrated with Telegram, handling 500+ queries daily with 95% resolution rate.",
        },
        {
          title: "E-Commerce MVP",
          description: "Full-featured online store built in 5 days with payment processing, inventory management, and automated order notifications.",
        },
        {
          title: "Lead Gen Automation",
          description: "End-to-end lead generation pipeline that scrapes, qualifies, and routes leads to the sales team automatically.",
        },
        {
          title: "SaaS Dashboard",
          description: "Analytics dashboard for a SaaS product with real-time data visualization, user management, and automated reporting.",
        },
        {
          title: "Booking Platform",
          description: "Appointment scheduling platform with calendar sync, automated reminders, and payment integration for a coaching business.",
        },
        {
          title: "Content Workflow Engine",
          description: "AI-powered content pipeline that generates, reviews, and publishes blog posts and social media content automatically.",
        },
      ],
      ru: [
        {
          title: "AI-бот поддержки клиентов",
          description: "Автоматизированная система поддержки на базе OpenAI API с интеграцией в Telegram. Обрабатывает 500+ запросов в неделю.",
        },
        {
          title: "MVP Интернет-магазина",
          description: "Полнофункциональный интернет-магазин, созданный за 5 дней с обработкой платежей, управлением складом и автоматическими уведомлениями.",
        },
        {
          title: "Автоматизация лидогенерации",
          description: "Комплексная система генерации лидов, которая автоматически собирает, квалифицирует и распределяет лиды по команде продаж.",
        },
        {
          title: "SaaS Дашборд",
          description: "Аналитический дашборд для SaaS-продукта с визуализацией данных в реальном времени, управлением пользователями и автоматической отчётностью.",
        },
        {
          title: "Платформа бронирования",
          description: "Платформа для записи на приём с синхронизацией календаря, автоматическими напоминаниями и интеграцией платежей.",
        },
        {
          title: "Система контент-маркетинга",
          description: "AI-система для автоматической генерации, проверки и публикации контента для блога и социальных сетей.",
        },
      ],
    },
  },
  services: {
    label: { en: "What I Offer", ru: "Что я предлагаю" },
    title: { en: "Services", ru: "Услуги" },
    subtitle: {
      en: "End-to-end solutions from concept to deployment, optimized for speed and reliability.",
      ru: "Комплексные решения от концепции до запуска, оптимизированные по скорости и надёжности.",
    },
    items: {
      en: [
        { title: "MVP Development", description: "Turn your idea into a working product in days. Full-featured MVPs with user auth, payments, and integrations — ready for launch." },
        { title: "Workflow Automation", description: "Eliminate repetitive tasks with smart automations. Connect your tools, sync data, and streamline operations across your business." },
        { title: "AI Integration", description: "Embed AI-powered features into your product — chatbots, content generation, data analysis, and intelligent automation." },
      ],
      ru: [
        { title: "Разработка MVP", description: "Превратите идею в работающий продукт за несколько дней. Полнофункциональные MVP с авторизацией, платежами и интеграциями." },
        { title: "Автоматизация процессов", description: "Устраните рутинные задачи с помощью умных автоматизаций. Подключите инструменты, синхронизируйте данные и оптимизируйте работу." },
        { title: "Интеграция AI", description: "Встраивайте AI-функции в ваш продукт — чат-боты, генерацию контента, анализ данных и интеллектуальную автоматизацию." },
      ],
    },
    discuss: { en: "Discuss", ru: "Обсудить" },
  },
  testimonials: {
    label: { en: "Feedback", ru: "Отзывы" },
    title: { en: "What Clients Say", ru: "Что говорят клиенты" },
    subtitle: {
      en: "Trusted by founders and teams to deliver fast, reliable solutions.",
      ru: "Мне доверяют основатели и команды для быстрых и надёжных решений.",
    },
    starRating: { en: "5 star rating", ru: "Оценка 5 звёзд" },
    scrollLeft: { en: "Scroll testimonials left", ru: "Прокрутить отзывы влево" },
    scrollRight: { en: "Scroll testimonials right", ru: "Прокрутить отзывы вправо" },
    noTestimonials: { 
      en: "No testimonials yet", 
      ru: "Здесь пока ничего нет" 
    },
    addTestimonial: { 
      en: "Add Testimonial", 
      ru: "Добавить отзыв" 
    },
  },
  contact: {
    label: { en: "Get In Touch", ru: "Связь" },
    title: { en: "Contact Me", ru: "Свяжитесь со мной" },
    subtitle: {
      en: "Have an idea or project in mind? Let's discuss how I can help bring it to life.",
      ru: "Есть идея или проект? Давайте обсудим, как я могу помочь.",
    },
    infoTitle: {
      en: "Let's work together",
      ru: "Давайте работать вместе",
    },
    infoText: {
      en: "Whether you need a quick MVP, workflow automation, or AI integration — I'm ready to help. Fill out the form or reach out directly.",
      ru: "Нужен быстрый MVP, автоматизация процессов или интеграция AI? Заполните форму или напишите напрямую.",
    },
    email: "hello@devfolio.com",
    location: { en: "Remote / Worldwide", ru: "Удалённо / По всему миру" },
    responseTime: { en: "Usually responds within 24h", ru: "Обычно отвечаю в течение 24ч" },
    nameLabel: { en: "Name", ru: "Имя" },
    namePlaceholder: { en: "Your name", ru: "Ваше имя" },
    emailLabel: { en: "Email", ru: "Эл. почта" },
    emailPlaceholder: { en: "you@example.com", ru: "you@example.com" },
    messageLabel: { en: "Message", ru: "Сообщение" },
    messagePlaceholder: { en: "Tell me about your project...", ru: "Расскажите о вашем проекте..." },
    sendButton: { en: "Send Message", ru: "Отправить" },
    formAriaLabel: { en: "Contact form", ru: "Форма связи" },
  },
  footer: {
    text: {
      en: "Built with vibes and no-code tools.",
      ru: "Создано с вайбом и no-code инструментами.",
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