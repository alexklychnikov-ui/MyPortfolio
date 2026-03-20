from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    api_internal_key: str = Field(default="", alias="API_INTERNAL_KEY")

    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")

    github_token: str | None = Field(default=None, alias="GITHUB_TOKEN")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    proxy_base_url: str | None = Field(default=None, alias="PROXY_BASE_URL")
    proxy_api_key: str | None = Field(default=None, alias="PROXY_API_KEY")

    prompt_projects_path: str = Field(
        default="/app/prompts/projects.system.prompt.txt",
        alias="PROMPT_PROJECTS_PATH",
    )
    prompt_services_path: str = Field(
        default="/app/prompts/services.system.prompt.txt",
        alias="PROMPT_SERVICES_PATH",
    )
    prompt_skills_path: str = Field(
        default="/app/prompts/skills.system.prompt.txt",
        alias="PROMPT_SKILLS_PATH",
    )
    static_export_dir: str | None = Field(default=None, alias="STATIC_EXPORT_DIR")


settings = Settings()
