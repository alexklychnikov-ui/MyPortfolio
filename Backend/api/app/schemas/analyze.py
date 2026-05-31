from pydantic import BaseModel, Field, HttpUrl


class AnalyzeRequest(BaseModel):
    repositories: list[HttpUrl] = Field(min_length=1, max_length=10)


class LocalizedText(BaseModel):
    ru: str
    en: str


class GeneratedProject(BaseModel):
    title: LocalizedText
    description: LocalizedText
    goal: LocalizedText
    role: LocalizedText
    result: LocalizedText
    stack: str
    tag: str
    demoUrl: str | None = None
    image: str | None = None


class GeneratedService(BaseModel):
    id: str | None = None
    title: LocalizedText
    description: LocalizedText


class GeneratedSkills(BaseModel):
    languageRuntime: list[str]
    aiLlm: list[str]
    backend: list[str]
    botsIntegrations: list[str]
    infrastructure: list[str]
    automation: list[str]
    devTools: list[str]


class AnalyzeResponseData(BaseModel):
    projects: list[GeneratedProject]
    services: list[GeneratedService]
    skills: GeneratedSkills


class AnalyzeResponse(BaseModel):
    success: bool
    data: AnalyzeResponseData
    skipped: list[dict[str, str]]
