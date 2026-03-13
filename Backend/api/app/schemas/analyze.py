from pydantic import BaseModel, Field, HttpUrl


class AnalyzeRequest(BaseModel):
    repositories: list[HttpUrl] = Field(min_length=1, max_length=10)


class LocalizedText(BaseModel):
    ru: str
    en: str


class GeneratedProject(BaseModel):
    title: LocalizedText
    description: LocalizedText
    stack: str
    tag: HttpUrl


class GeneratedService(BaseModel):
    id: str | None = None
    title: LocalizedText
    description: LocalizedText


class GeneratedSkills(BaseModel):
    nocode: list[str]
    ai: list[str]
    automation: list[str]


class AnalyzeResponseData(BaseModel):
    projects: list[GeneratedProject]
    services: list[GeneratedService]
    skills: GeneratedSkills


class AnalyzeResponse(BaseModel):
    success: bool
    data: AnalyzeResponseData
    skipped: list[dict[str, str]]
