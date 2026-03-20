"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "./i18n"

const defaultTabs = [
  {
    id: "nocode",
    labelKey: "tabNoCode" as const,
    tools: ["Lovable", "Bubble", "Webflow", "Framer", "Airtable", "Notion"],
  },
  {
    id: "ai",
    labelKey: "tabAI" as const,
    tools: ["OpenAI API", "Cursor", "Claude API", "LangChain", "Pinecone", "Supabase"],
  },
  {
    id: "automation",
    labelKey: "tabAutomation" as const,
    tools: ["Make", "n8n", "Zapier", "Telegram Bots", "Webhooks", "Cron Jobs"],
  },
]

type SkillCategory = "nocode" | "ai" | "automation"

interface SkillsData {
  nocode?: string[]
  ai?: string[]
  automation?: string[]
}

export default function Skills() {
  const { locale, t } = useI18n()
  const [activeTab, setActiveTab] = useState("nocode")
  const [skills, setSkills] = useState<SkillsData>({})

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch("/data/skills.json")
        if (!response.ok) return
        const data = await response.json()
        setSkills(data ?? {})
      } catch {
      }
    }

    loadSkills()
  }, [])

  const tabs = useMemo(
    () =>
      defaultTabs.map((tab) => {
        const dynamicTools = skills[tab.id as SkillCategory]
        return {
          ...tab,
          tools: Array.isArray(dynamicTools) && dynamicTools.length > 0 ? dynamicTools : tab.tools,
        }
      }),
    [skills]
  )

  return (
    <section id="skills" className="section skills-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">{t.skills.label[locale]}</span>
          <h2 className="section-title">{t.skills.title[locale]}</h2>
          <p className="section-subtitle">{t.skills.subtitle[locale]}</p>
        </div>

        <div className="tabs-nav" role="tablist" aria-label={t.skills.ariaLabel[locale]}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {t.skills[tab.labelKey][locale]}
            </button>
          ))}
        </div>

        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={tab.id}
            className={`tab-panel${activeTab === tab.id ? " active" : ""}`}
          >
            <div className="badges-grid">
              {tab.tools.map((tool) => (
                <span key={tool} className="badge">{tool}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
