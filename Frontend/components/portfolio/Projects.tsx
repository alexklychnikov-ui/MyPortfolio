"use client"

import { useEffect, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import { ArrowLeft, ArrowRight, ExternalLink, Github, Globe, Images, Play, X } from "lucide-react"
import { useI18n } from "./i18n"

interface LocalizedText {
  ru: string
  en: string
}

interface ProjectMediaItem {
  url: string
  label: string
}

interface Project {
  id: string
  title: LocalizedText
  description: LocalizedText
  goal?: LocalizedText
  role?: LocalizedText
  result?: LocalizedText
  stack: string
  tag: string
  demoUrl?: string
  image?: string
  screenshots?: ProjectMediaItem[]
  videos?: ProjectMediaItem[]
}

const emblaOptions = {
  align: "start" as const,
  loop: false,
  dragFree: true,
  containScroll: "trimSnaps" as const,
}

const GITHUB_PROFILE =
  process.env.NEXT_PUBLIC_GITHUB_PROFILE_URL?.trim() ||
  "https://github.com/alexklychnikov-ui"

function pickLocalized(text: LocalizedText | undefined, locale: "ru" | "en"): string {
  if (!text) return ""
  return text[locale] || text.ru
}

function hasCaseStudy(project: Project): boolean {
  return Boolean(
    project.goal?.ru ||
      project.goal?.en ||
      project.role?.ru ||
      project.role?.en ||
      project.result?.ru ||
      project.result?.en
  )
}

function isExternalVideo(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|loom\.com|vimeo\.com|rutube\.ru)/i.test(url)
}

export default function Projects({ initialProjects = [] }: { initialProjects?: Project[] }) {
  const { locale, t } = useI18n()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [loading, setLoading] = useState(initialProjects.length === 0)
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (initialProjects.length > 0) return
    const loadProjects = async () => {
      try {
        const response = await fetch("/data/projects.json")
        if (!response.ok) throw new Error("Failed to load projects")
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Error loading projects:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [initialProjects.length])

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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const sectionHeader = (
    <div className="section-header">
      <span className="section-label">{t.projects.label[locale]}</span>
      <h2 className="section-title">{t.projects.title[locale]}</h2>
      <p className="section-subtitle">{t.projects.subtitle[locale]}</p>
    </div>
  )

  if (loading) {
    return (
      <section id="projects" className="section">
        <div className="section-container">
          {sectionHeader}
          <div className="projects-loading">{t.projects.loading[locale]}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="projects" className="section">
      <div className="section-container">
        {sectionHeader}

        <div className="projects-carousel">
          <div className="projects-carousel-viewport" ref={emblaRef}>
            <div className="projects-carousel-track">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} locale={locale} />
              ))}
            </div>
          </div>

          <NavigationButtons
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
            onPrev={scrollPrev}
            onNext={scrollNext}
          />
        </div>

        <div className="projects-cta">
          <p className="projects-cta-title">{t.projects.cta.title[locale]}</p>
          <div className="projects-cta-buttons">
            <a href="#contact" className="btn btn-primary">
              {t.projects.cta.contact[locale]}
            </a>
            <a
              href={GITHUB_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              {t.projects.cta.github[locale]}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project, locale }: { project: Project; locale: "ru" | "en" }) {
  const { t } = useI18n()
  const [imageFailed, setImageFailed] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const title = pickLocalized(project.title, locale)
  const description = pickLocalized(project.description, locale)
  const goal = pickLocalized(project.goal, locale)
  const role = pickLocalized(project.role, locale)
  const result = pickLocalized(project.result, locale)
  const techStack = project.stack.split(",").map((tech) => tech.trim()).filter(Boolean)
  const structured = hasCaseStudy(project)
  const screenshots = project.screenshots ?? []
  const videos = project.videos ?? []
  const hasMedia = screenshots.length > 0 || videos.length > 0
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="projects-carousel-slide">
      <article className="project-card group">
        <div className="project-thumb">
          {project.image && !imageFailed ? (
            <Image
              src={project.image}
              alt={title}
              width={640}
              height={360}
              className="project-thumb-img"
              unoptimized
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="project-thumb-placeholder" aria-hidden="true">
              <span>{initials}</span>
            </div>
          )}
        </div>

        <h3 className="project-card-title">{title}</h3>

        {structured ? (
          <>
            <p className="project-summary">{description}</p>

            {goal && (
              <div className="project-case-row">
                <span className="project-case-label">{t.projects.fields.goal[locale]}</span>
                <p className="project-case-value">{goal}</p>
              </div>
            )}

            {role && (
              <div className="project-case-row">
                <span className="project-case-label">{t.projects.fields.role[locale]}</span>
                <p className="project-case-value">{role}</p>
              </div>
            )}

            {result && (
              <div className="project-result">
                <span className="project-case-label">{t.projects.fields.result[locale]}</span>
                <p>{result}</p>
              </div>
            )}
          </>
        ) : (
          <p className="project-summary">{description}</p>
        )}

        {techStack.length > 0 && (
          <div className="project-tags">
            {techStack.map((tech, index) => (
              <span key={index} className="project-tag">
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="project-links">
          {project.tag && (
            <a
              href={project.tag}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link"
              aria-label={`${t.projects.links.github[locale]} — ${title}`}
            >
              <Github className="project-link-icon" />
              <span>{t.projects.links.github[locale]}</span>
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link project-link-demo"
              aria-label={`${t.projects.links.demo[locale]} — ${title}`}
            >
              <Globe className="project-link-icon" />
              <span>{t.projects.links.demo[locale]}</span>
              <ExternalLink className="project-link-ext" />
            </a>
          )}
          {hasMedia && (
            <button
              type="button"
              className="project-link project-link-media"
              onClick={() => setMediaOpen(true)}
              aria-label={`${t.projects.links.media[locale]} — ${title}`}
            >
              {videos.length > 0 ? (
                <Play className="project-link-icon" />
              ) : (
                <Images className="project-link-icon" />
              )}
              <span>{t.projects.links.media[locale]}</span>
            </button>
          )}
        </div>
      </article>

      {mediaOpen && (
        <ProjectMediaModal
          title={title}
          screenshots={screenshots}
          videos={videos}
          locale={locale}
          onClose={() => setMediaOpen(false)}
        />
      )}
    </div>
  )
}

function ProjectMediaModal({
  title,
  screenshots,
  videos,
  locale,
  onClose,
}: {
  title: string
  screenshots: ProjectMediaItem[]
  videos: ProjectMediaItem[]
  locale: "ru" | "en"
  onClose: () => void
}) {
  const { t } = useI18n()
  const initialTab = screenshots.length > 0 ? "screenshots" : "videos"
  const [tab, setTab] = useState<"screenshots" | "videos">(initialTab)
  const [shotIndex, setShotIndex] = useState(0)
  const [videoIndex, setVideoIndex] = useState(0)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (tab === "screenshots" && screenshots.length > 1) {
        if (event.key === "ArrowLeft") setShotIndex((i) => Math.max(0, i - 1))
        if (event.key === "ArrowRight") setShotIndex((i) => Math.min(screenshots.length - 1, i + 1))
      }
      if (tab === "videos" && videos.length > 1) {
        if (event.key === "ArrowLeft") setVideoIndex((i) => Math.max(0, i - 1))
        if (event.key === "ArrowRight") setVideoIndex((i) => Math.min(videos.length - 1, i + 1))
      }
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, tab, screenshots.length, videos.length])

  const shot = screenshots[shotIndex]
  const video = videos[videoIndex]

  return (
    <div className="project-media-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="project-media-backdrop" aria-label="Close" onClick={onClose} />
      <div className="project-media-dialog">
        <div className="project-media-header">
          <div>
            <p className="project-media-kicker">{t.projects.links.media[locale]}</p>
            <h4 className="project-media-title">{title}</h4>
          </div>
          <button type="button" className="project-media-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="project-media-tabs">
          {screenshots.length > 0 && (
            <button
              type="button"
              className={`project-media-tab${tab === "screenshots" ? " is-active" : ""}`}
              onClick={() => setTab("screenshots")}
            >
              {t.projects.media.screenshots[locale]} ({screenshots.length})
            </button>
          )}
          {videos.length > 0 && (
            <button
              type="button"
              className={`project-media-tab${tab === "videos" ? " is-active" : ""}`}
              onClick={() => setTab("videos")}
            >
              {t.projects.media.videos[locale]} ({videos.length})
            </button>
          )}
        </div>

        {tab === "screenshots" && shot && (
          <div className="project-media-body">
            <div className="project-media-stage-wrap">
              {screenshots.length > 1 && (
                <button
                  type="button"
                  className="project-media-nav project-media-nav-prev"
                  disabled={shotIndex === 0}
                  onClick={() => setShotIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous screenshot"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="project-media-stage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.url} alt={shot.label} loading="lazy" />
              </div>
              {screenshots.length > 1 && (
                <button
                  type="button"
                  className="project-media-nav project-media-nav-next"
                  disabled={shotIndex >= screenshots.length - 1}
                  onClick={() => setShotIndex((i) => Math.min(screenshots.length - 1, i + 1))}
                  aria-label="Next screenshot"
                >
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
            <p className="project-media-caption">
              {shot.label}
              {screenshots.length > 1 ? ` · ${shotIndex + 1} / ${screenshots.length}` : ""}
            </p>
          </div>
        )}

        {tab === "videos" && video && (
          <div className="project-media-body">
            <div className="project-media-stage-wrap">
              {videos.length > 1 && (
                <button
                  type="button"
                  className="project-media-nav project-media-nav-prev"
                  disabled={videoIndex === 0}
                  onClick={() => setVideoIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous video"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="project-media-stage project-media-stage-video">
                {isExternalVideo(video.url) ? (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-media-external-video"
                  >
                    <Play size={18} />
                    <span>{video.label}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <video key={video.url} src={video.url} controls playsInline preload="metadata" />
                )}
              </div>
              {videos.length > 1 && (
                <button
                  type="button"
                  className="project-media-nav project-media-nav-next"
                  disabled={videoIndex >= videos.length - 1}
                  onClick={() => setVideoIndex((i) => Math.min(videos.length - 1, i + 1))}
                  aria-label="Next video"
                >
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
            <p className="project-media-caption">
              {video.label}
              {videos.length > 1 ? ` · ${videoIndex + 1} / ${videos.length}` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function NavigationButtons({
  canScrollPrev,
  canScrollNext,
  onPrev,
  onNext,
}: {
  canScrollPrev: boolean
  canScrollNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canScrollPrev}
        className="projects-nav-btn projects-nav-prev"
        aria-label="Previous projects"
      >
        <ArrowLeft className="projects-nav-icon" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canScrollNext}
        className="projects-nav-btn projects-nav-next"
        aria-label="Next projects"
      >
        <ArrowRight className="projects-nav-icon" />
      </button>
    </>
  )
}
