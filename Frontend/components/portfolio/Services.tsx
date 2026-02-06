"use client"

import { useI18n } from "./i18n"
import { useState, useEffect } from "react"

interface Service {
  id: string
  title: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
}

const icons = [
  <svg key="bolt" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  <svg key="chart" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>,
  <svg key="ai" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
  <svg key="website" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
]

export default function Services() {
  const { locale, t } = useI18n()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch('/data/services.json')
        const data = await response.json()
        setServices(data)
      } catch (error) {
        console.error('Error loading services:', error)
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  if (loading) {
    return (
      <section id="services" className="section services-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">{t.services.label[locale]}</span>
            <h2 className="section-title">{t.services.title[locale]}</h2>
            <p className="section-subtitle">{t.services.subtitle[locale]}</p>
          </div>
          <div className="services-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="service-card" style={{ opacity: 0.5 }}>
                <div className="service-icon">...</div>
                <h3>Загрузка...</h3>
                <p>Загружаем услуги...</p>
                <div style={{ marginTop: '16px' }}>
                  <span className="btn btn-accent btn-sm" style={{ cursor: 'default', opacity: 0.5 }}>
                    {t.services.discuss[locale]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="services" className="section services-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">{t.services.label[locale]}</span>
          <h2 className="section-title">{t.services.title[locale]}</h2>
          <p className="section-subtitle">{t.services.subtitle[locale]}</p>
        </div>

        <div className="services-grid">
          {services.map((service, i) => {
            const currentTitle = service.title[locale] || service.title.ru
            const currentDescription = service.description[locale] || service.description.ru
            
            return (
              <div key={service.id} className="service-card">
                <div className="service-icon">{icons[i] || icons[0]}</div>
                <h3>{currentTitle}</h3>
                <p>{currentDescription}</p>
                <a href="#contact" className="btn btn-accent btn-sm">
                  {t.services.discuss[locale]}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
