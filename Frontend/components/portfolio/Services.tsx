"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "./i18n"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"

interface LocalizedText {
  ru: string
  en: string
}

interface Service {
  id: string
  title: LocalizedText
  description: LocalizedText
  price?: LocalizedText
  timeline?: LocalizedText
}

const PAGE_SIZE = 6

const icons = [
  <svg key="bolt" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  <svg key="chart" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>,
  <svg key="ai" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
  <svg key="website" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
]

function chunkServices(items: Service[], size: number): Service[][] {
  if (items.length === 0) return []
  const pages: Service[][] = []
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size))
  }
  return pages
}

export default function Services({ initialServices = [] }: { initialServices?: Service[] }) {
  const { locale, t } = useI18n()
  const [services, setServices] = useState<Service[]>(initialServices)
  const [loading, setLoading] = useState(initialServices.length === 0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const revealRef = useScrollReveal<HTMLElement>()
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" })

  const pages = useMemo(() => chunkServices(services, PAGE_SIZE), [services])

  useEffect(() => {
    if (initialServices.length > 0) return
    const loadServices = async () => {
      try {
        const response = await fetch("/data/services.json")
        if (!response.ok) throw new Error("Failed to load services")
        const data = await response.json()
        setServices(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error loading services:", error)
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [initialServices.length])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  useEffect(() => {
    emblaApi?.reInit()
  }, [emblaApi, pages.length])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const sectionHeader = (
    <div className="section-header">
      <span className="section-label">{t.services.label[locale]}</span>
      <h2 className="section-title">{t.services.title[locale]}</h2>
      <p className="section-subtitle">{t.services.subtitle[locale]}</p>
    </div>
  )

  if (loading) {
    return (
      <section id="services" className="section services-section reveal-section" ref={revealRef}>
        <div className="section-container">
          {sectionHeader}
          <div className="services-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="service-card" style={{ opacity: 0.5 }}>
                <div className="service-icon">...</div>
                <h3>Загрузка...</h3>
                <p>Загружаем услуги...</p>
                <div style={{ marginTop: "16px" }}>
                  <span className="btn btn-accent btn-sm" style={{ cursor: "default", opacity: 0.5 }}>
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

  const showNav = pages.length > 1

  return (
    <section id="services" className="section services-section reveal-section" ref={revealRef}>
      <div className="section-container">
        {sectionHeader}

        <div className="services-carousel">
          <div className="services-carousel-viewport" ref={emblaRef}>
            <div className="services-carousel-track">
              {pages.map((page, pageIndex) => (
                <div className="services-carousel-slide" key={`services-page-${pageIndex}`}>
                  <div className="services-grid">
                    {page.map((service, i) => {
                      const currentTitle = service.title[locale] || service.title.ru
                      const currentDescription = service.description[locale] || service.description.ru
                      const price = service.price?.[locale] || service.price?.ru
                      const timeline = service.timeline?.[locale] || service.timeline?.ru
                      const iconIndex = (pageIndex * PAGE_SIZE + i) % icons.length

                      return (
                        <div key={service.id} className="service-card">
                          <div className="service-icon">{icons[iconIndex]}</div>
                          <h3>{currentTitle}</h3>
                          <p>{currentDescription}</p>
                          {(price || timeline) && (
                            <div className="service-meta">
                              {price && <span className="service-price">{price}</span>}
                              {price && timeline && <span className="service-meta-sep" aria-hidden>/</span>}
                              {timeline && <span className="service-timeline">{timeline}</span>}
                            </div>
                          )}
                          <a href="#contact" className="btn btn-accent btn-sm">
                            {t.services.discuss[locale]}
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showNav && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="services-nav-btn services-nav-prev"
                aria-label={t.services.scrollLeft[locale]}
              >
                <ArrowLeft className="services-nav-icon" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="services-nav-btn services-nav-next"
                aria-label={t.services.scrollRight[locale]}
              >
                <ArrowRight className="services-nav-icon" />
              </button>
              <div className="services-carousel-dots" role="tablist" aria-label={t.services.pages[locale]}>
                {pages.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={idx === selectedIndex}
                    className={`services-carousel-dot${idx === selectedIndex ? " is-active" : ""}`}
                    onClick={() => emblaApi?.scrollTo(idx)}
                    aria-label={`${idx + 1} / ${pages.length}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
