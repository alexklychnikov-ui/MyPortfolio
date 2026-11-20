"""Regression fixtures: short facts for current portfolio repos (no live GitHub/AI)."""

ACCEPTED_REPOS = [
    {
        "owner": "alexklychnikov-ui",
        "repo": "ContentForge",
        "repo_url": "https://github.com/alexklychnikov-ui/ContentForge",
        "description": "AI content calendar and Telegram/VK autopost",
        "topics": ["smm", "telegram", "openai"],
        "languages": ["Python"],
        "readme": "# ContentForge\nAI drafts + scheduled publish to Telegram/VK. Queue and error log.",
    },
    {
        "owner": "alexklychnikov-ui",
        "repo": "PersonalAICoach",
        "repo_url": "https://github.com/alexklychnikov-ui/PersonalAICoach",
        "description": "Career coach with plans and Telegram reminders",
        "topics": ["openai", "telegram"],
        "languages": ["Python"],
        "readme": "# PersonalAICoach\nGoal → plan → progress → reminders in Telegram.",
    },
    {
        "owner": "alexklychnikov-ui",
        "repo": "WebScraperForNews",
        "repo_url": "https://github.com/alexklychnikov-ui/WebScraperForNews",
        "description": "News scraper and digest",
        "topics": ["scraper", "rss"],
        "languages": ["Python"],
        "readme": "# WebScraperForNews\nParse public pages/RSS, dedupe, digest delivery.",
    },
    {
        "owner": "alexklychnikov-ui",
        "repo": "MyPortfolio",
        "repo_url": "https://github.com/alexklychnikov-ui/MyPortfolio",
        "description": "Portfolio site + Telegram manage section",
        "topics": ["nextjs", "fastapi", "telegram"],
        "languages": ["TypeScript", "Python"],
        "readme": "# MyPortfolio\nNext.js portfolio. Telegram bot updates site section. Docker VPS deploy.",
    },
    {
        "owner": "alexklychnikov-ui",
        "repo": "AI-PredictiveSalesAnalytics",
        "repo_url": "https://github.com/alexklychnikov-ui/AI-PredictiveSalesAnalytics",
        "description": "Sales dashboard and forecast pilot",
        "topics": ["forecast", "dashboard"],
        "languages": ["Python"],
        "readme": "# AI-PredictiveSalesAnalytics\nExcel/CSV KPI dashboard + sales forecast pilot. No accuracy guarantee.",
    },
    {
        "owner": "alexklychnikov-ui",
        "repo": "FullCRM",
        "repo_url": "https://github.com/alexklychnikov-ui/FullCRM",
        "description": "Modular mini CRM foundation",
        "topics": ["crm", "fastapi"],
        "languages": ["Python"],
        "readme": "# FullCRM\nContacts, one pipeline foundation. Adapt for one org.",
    },
    {
        "owner": "alexklychnikov-ui",
        "repo": "TGRecordsOfExpenses",
        "repo_url": "https://github.com/alexklychnikov-ui/TGRecordsOfExpenses",
        "description": "Expense bot with reports; receipt OCR module",
        "topics": ["telegram", "expenses"],
        "languages": ["Python"],
        "readme": "# TGRecordsOfExpenses\nText expenses, categories, Excel export. Receipt recognition module ready.",
    },
]

SKILLS = {
    "languageRuntime": ["Python", "X++ (Axapta)", "JavaScript (basic)"],
    "aiLlm": ["OpenAI API", "LangChain", "Prompt engineering", "RAG (LightRAG)"],
    "backend": ["FastAPI", "Flask", "REST API", "asyncio", "PostgreSQL"],
    "botsIntegrations": ["Telegram Bot API", "aiogram", "SQLite", "PostgreSQL"],
    "infrastructure": ["Docker", "Linux (VPS)", "Git", "GitHub Actions"],
    "automation": ["Make", "n8n", "Bot + DB + external API"],
    "devTools": ["Cursor", "VS Code"],
}


def candidate(
    key: str,
    *,
    sources: list[str],
    evidence: str,
    evidence_type: str = "project",
    status: str = "ready",
    title_ru: str = "",
    title_en: str = "",
    desc_ru: str = "Результат для клиента.",
    desc_en: str = "Customer deliverable.",
) -> dict:
    return {
        "canonical_key": key,
        "title": {"ru": title_ru or key, "en": title_en or key},
        "description": {"ru": desc_ru, "en": desc_en},
        "source_repositories": sources,
        "evidence_summary": evidence,
        "evidence_type": evidence_type,
        "implementation_status": status,
    }
