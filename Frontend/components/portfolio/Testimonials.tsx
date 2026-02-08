"use client"

import { useRef, useState, useEffect } from "react"
import { useI18n } from "./i18n"

interface Testimonial {
  text: {
    ru: string
    en: string
  }
  author: {
    ru: string
    en: string
  }
  role: {
    ru: string
    en: string
  }
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function Testimonials() {
  const { locale, t } = useI18n()
  const trackRef = useRef<HTMLDivElement>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const response = await fetch('/data/testimonials.json')
        const data = await response.json()
        setTestimonials(data)
      } catch (error) {
        console.error('Error loading testimonials:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTestimonials()
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (!trackRef.current) return
    const amount = direction === "left" ? -380 : 380
    trackRef.current.scrollBy({ left: amount, behavior: "smooth" })
  }

  if (loading) {
    return (
      <section id="testimonials" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">{t.testimonials.label[locale]}</span>
            <h2 className="section-title">{t.testimonials.title[locale]}</h2>
            <p className="section-subtitle">{t.testimonials.subtitle[locale]}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <p>Загрузка отзывов...</p>
          </div>
        </div>
      </section>
    )
  }

  // Если отзывов нет, показываем заглушку
  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">{t.testimonials.label[locale]}</span>
            <h2 className="section-title">{t.testimonials.title[locale]}</h2>
            <p className="section-subtitle">{t.testimonials.subtitle[locale]}</p>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '18px',
          }}>
            {t.testimonials.noTestimonials[locale]}
          </div>
        </div>
      </section>
    )
  }

  // Если есть отзывы, показываем их как обычно
  return (
    <section id="testimonials" className="section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">{t.testimonials.label[locale]}</span>
          <h2 className="section-title">{t.testimonials.title[locale]}</h2>
          <p className="section-subtitle">{t.testimonials.subtitle[locale]}</p>
        </div>

        <div className="testimonials-track" ref={trackRef} role="list">
          {testimonials.map((testimonial, i) => {
            const currentText = testimonial.text[locale] || testimonial.text.ru
            const currentAuthor = testimonial.author[locale] || testimonial.author.ru
            const currentRole = testimonial.role[locale] || testimonial.role.ru
            const initials = currentAuthor.split(' ').map(name => name[0]).join('').toUpperCase()
            
            return (
              <div key={i} className="testimonial-card" role="listitem">
                <div className="testimonial-stars" aria-label={t.testimonials.starRating[locale]}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} />
                  ))}
                </div>
                <blockquote>{`«${currentText}»`}</blockquote>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" aria-hidden="true">
                    {initials}
                  </div>
                  <div className="testimonial-info">
                    <strong>{currentAuthor}</strong>
                    <span>{currentRole}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {testimonials.length > 1 && (
          <div className="testimonials-controls">
            <button
              className="slider-btn"
              onClick={() => scroll("left")}
              aria-label={t.testimonials.scrollLeft[locale]}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="slider-btn"
              onClick={() => scroll("right")}
              aria-label={t.testimonials.scrollRight[locale]}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
