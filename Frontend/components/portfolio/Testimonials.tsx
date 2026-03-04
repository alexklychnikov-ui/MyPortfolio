"use client"

import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import { useI18n } from "./i18n"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Testimonial {
  text: { ru: string; en: string }
  author: { ru: string; en: string }
  role: { ru: string; en: string }
  rating?: number
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function Testimonials() {
  const { locale, t } = useI18n()
  const trackRef = useRef<HTMLDivElement>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [formTask, setFormTask] = useState("")
  const [formImpressions, setFormImpressions] = useState("")
  const [formAuthor, setFormAuthor] = useState("")
  const [formRole, setFormRole] = useState("")
  const [formRating, setFormRating] = useState<number>(5)

  const loadTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials")
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data)
      } else {
        setTestimonials([])
      }
    } catch {
      setTestimonials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTestimonials()
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (!trackRef.current) return
    const amount = direction === "left" ? -380 : 380
    trackRef.current.scrollBy({ left: amount, behavior: "smooth" })
  }

  const openModal = () => {
    setFormTask("")
    setFormImpressions("")
    setFormAuthor("")
    setFormRole("")
    setFormRating(5)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = [formTask.trim(), formImpressions.trim()].filter(Boolean).join("\n\n")
    if (text.length < 20) {
      toast.error(t.testimonials.formError[locale])
      return
    }
    if (!formAuthor.trim()) {
      toast.error(t.testimonials.formError[locale])
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          author: formAuthor.trim(),
          role: formRole.trim() || undefined,
          rating: formRating,
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (data.success) {
        toast.success(t.testimonials.formSuccess[locale])
        setModalOpen(false)
      } else {
        toast.error(data.error ?? t.testimonials.formError[locale])
      }
    } catch {
      toast.error(t.testimonials.formError[locale])
    } finally {
      setSending(false)
    }
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
          <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
            <p>Загрузка отзывов...</p>
          </div>
        </div>
      </section>
    )
  }

  const testimonialForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="testimonial-task" className="block text-sm font-medium mb-1">
          {t.testimonials.formTaskLabel[locale]}
        </label>
        <textarea
          id="testimonial-task"
          value={formTask}
          onChange={(e) => setFormTask(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        />
      </div>
      <div>
        <label htmlFor="testimonial-impressions" className="block text-sm font-medium mb-1">
          {t.testimonials.formImpressionsLabel[locale]}
        </label>
        <textarea
          id="testimonial-impressions"
          value={formImpressions}
          onChange={(e) => setFormImpressions(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        />
      </div>
      <div>
        <label htmlFor="testimonial-author" className="block text-sm font-medium mb-1">
          {t.testimonials.formAuthorLabel[locale]}
        </label>
        <input
          id="testimonial-author"
          type="text"
          value={formAuthor}
          onChange={(e) => setFormAuthor(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        />
      </div>
      <div>
        <span className="block text-sm font-medium mb-1">{t.testimonials.formRatingLabel[locale]}</span>
        <div className="flex gap-1" role="group" aria-label={t.testimonials.starRating[locale]}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setFormRating(n)}
              className="p-1 text-amber-500 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary rounded"
              aria-label={`${n} stars`}
            >
              <StarIcon filled={n <= formRating} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="testimonial-role" className="block text-sm font-medium mb-1">
          {t.testimonials.formRoleLabel[locale]}
        </label>
        <input
          id="testimonial-role"
          type="text"
          value={formRole}
          onChange={(e) => setFormRole(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={sending}>
        {sending ? t.testimonials.formSending[locale] : t.testimonials.formSubmit[locale]}
      </button>
    </form>
  )

  if (testimonials.length === 0) {
    return (
      <>
        <section id="testimonials" className="section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-label">{t.testimonials.label[locale]}</span>
              <h2 className="section-title">{t.testimonials.title[locale]}</h2>
              <p className="section-subtitle">{t.testimonials.subtitle[locale]}</p>
            </div>
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openModal}
                aria-label={t.testimonials.addTestimonial[locale]}
              >
                {t.testimonials.addTestimonial[locale]}
              </button>
            </div>
          </div>
        </section>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.testimonials.addTestimonial[locale]}</DialogTitle>
            </DialogHeader>
            {testimonialForm}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <section id="testimonials" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">{t.testimonials.label[locale]}</span>
            <h2 className="section-title">{t.testimonials.title[locale]}</h2>
            <p className="section-subtitle">{t.testimonials.subtitle[locale]}</p>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={openModal}>
                {t.testimonials.addTestimonial[locale]}
              </button>
            </div>
          </div>

          <div className="testimonials-track" ref={trackRef} role="list">
            {testimonials.map((testimonial, i) => {
              const currentText = testimonial.text[locale] || testimonial.text.ru
              const currentAuthor = testimonial.author[locale] || testimonial.author.ru
              const currentRole = (testimonial.role && (testimonial.role[locale] || testimonial.role.ru)) || ""
              const initials = currentAuthor.split(" ").map((n) => n[0]).join("").toUpperCase()
              const stars = testimonial.rating ?? 5
              return (
                <div key={i} className="testimonial-card" role="listitem">
                  <div className="testimonial-stars" aria-label={t.testimonials.starRating[locale]}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <StarIcon key={j} filled={j < stars} />
                    ))}
                  </div>
                  <blockquote>{`«${currentText}»`}</blockquote>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar" aria-hidden="true">
                      {initials}
                    </div>
                    <div className="testimonial-info">
                      <strong>{currentAuthor}</strong>
                      {currentRole ? <span>{currentRole}</span> : null}
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.testimonials.addTestimonial[locale]}</DialogTitle>
          </DialogHeader>
          {testimonialForm}
        </DialogContent>
      </Dialog>
    </>
  )
}
