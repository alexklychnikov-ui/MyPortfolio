"use client"

import { useState } from "react"
import { useI18n } from "./i18n"

const tabs = [
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

export default function Skills() {
  const { locale, t } = useI18n()
  const [activeTab, setActiveTab] = useState("nocode")

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
