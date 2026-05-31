SKILL_CATEGORIES: tuple[str, ...] = (
    "languageRuntime",
    "aiLlm",
    "backend",
    "botsIntegrations",
    "infrastructure",
    "automation",
    "devTools",
)


def empty_skills_grouped() -> dict[str, list[str]]:
    return {category: [] for category in SKILL_CATEGORIES}
