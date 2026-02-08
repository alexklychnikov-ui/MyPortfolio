"use client"

import { useEffect, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight, ExternalLink, Github } from "lucide-react"
import { useI18n } from "./i18n"

interface Project {
  id: string
  title: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
  stack: string
  tag: string
}

// Настройки embla-carousel
const emblaOptions = {
  align: "start",
  loop: false,
  dragFree: true,
  containScroll: "trimSnaps" as const,
}

export default function Projects() {
  const { locale, t } = useI18n()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // embla-carousel refs
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch("/data/projects.json")
        if (!response.ok) {
          throw new Error("Failed to load projects")
        }
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Error loading projects:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Обновление состояния кнопок навигации
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  // Обработчики кнопок навигации
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  if (loading) {
    return (
      <section id="projects" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">{t.projects.label[locale]}</span>
            <h2 className="section-title">{t.projects.title[locale]}</h2>
            <p className="section-subtitle">{t.projects.subtitle[locale]}</p>
          </div>
          <div className="text-center py-12 text-gray-500">
            Loading projects...
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="projects" className="section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">{t.projects.label[locale]}</span>
          <h2 className="section-title">{t.projects.title[locale]}</h2>
          <p className="section-subtitle">{t.projects.subtitle[locale]}</p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  locale={locale}
                />
              ))}
            </div>
          </div>

          {/* Кнопки навигации */}
          <NavigationButtons
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
            onPrev={scrollPrev}
            onNext={scrollNext}
          />
        </div>
      </div>
    </section>
  )
}

// Компонент карточки проекта
interface ProjectCardProps {
  project: Project
  locale: "ru" | "en"
}

function ProjectCard({ project, locale }: ProjectCardProps) {
  const title = project.title[locale] || project.title.ru
  const description = project.description[locale] || project.description.ru
  const techStack = project.stack.split(",").map((tech) => tech.trim())

  return (
    <div className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333333%] min-w-0">
      <div className="project-card h-full flex flex-col">
        {/* Заголовок */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Описание */}
        <p className="text-gray-600 text-sm mb-4 flex-grow leading-relaxed">
          {description}
        </p>

        {/* Технологии */}
        <div className="flex flex-wrap gap-2 mb-4">
          {techStack.map((tech, index) => (
            <span
              key={index}
              className="project-tag"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Ссылка на репозиторий */}
        {project.tag && (
          <a
            href={project.tag}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors mt-auto"
            aria-label={`View ${title} on GitHub`}
          >
            <Github className="w-4 h-4" />
            <span>{locale === "ru" ? "GitHub" : "GitHub"}</span>
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        )}
      </div>
    </div>
  )
}

// Компонент кнопок навигации
interface NavigationButtonsProps {
  canScrollPrev: boolean
  canScrollNext: boolean
  onPrev: () => void
  onNext: () => void
}

function NavigationButtons({
  canScrollPrev,
  canScrollNext,
  onPrev,
  onNext,
}: NavigationButtonsProps) {
  return (
    <>
      {/* Кнопка "Влево" */}
      <button
        onClick={onPrev}
        disabled={!canScrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-10 p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
        aria-label="Previous projects"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Кнопка "Вправо" */}
      <button
        onClick={onNext}
        disabled={!canScrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-10 p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
        aria-label="Next projects"
      >
        <ArrowRight className="w-5 h-5 text-gray-700" />
      </button>
    </>
  )
}