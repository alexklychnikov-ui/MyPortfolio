"use client"

import { useI18n } from "./i18n"
import { useState, useEffect } from "react"

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

export default function Projects() {
  const { locale, t } = useI18n()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/data/projects.json')
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  if (loading) {
    return (
      <section id="projects" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">{t.projects.label[locale]}</span>
            <h2 className="section-title">{t.projects.title[locale]}</h2>
            <p className="section-subtitle">{t.projects.subtitle[locale]}</p>
          </div>
          <div className="projects-grid">
            {[1, 2, 3].map((i) => (
              <article key={i} className="project-card" style={{ opacity: 0.5 }}>
                <h3>Загрузка...</h3>
                <p>Загружаем проекты...</p>
                <div className="project-tags">
                  <span className="project-tag">...</span>
                </div>
              </article>
            ))}
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

        <div className="projects-grid">
          {projects.map((project) => {
            const techStack = project.stack.split(', ')
            const currentTitle = project.title[locale] || project.title.ru
            const currentDescription = project.description[locale] || project.description.ru
            
            return (
              <article key={project.id} className="project-card">
                <h3>{currentTitle}</h3>
                <p>{currentDescription}</p>
                <div className="project-tags">
                  {techStack.map((tech, index) => (
                    <span key={index} className="project-tag">{tech}</span>
                  ))}
                </div>
                {project.tag && (
                  <div style={{ marginTop: '16px' }}>
                    <a 
                      href={project.tag} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      {locale === 'ru' ? 'Посмотреть код' : 'View code'}
                    </a>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
