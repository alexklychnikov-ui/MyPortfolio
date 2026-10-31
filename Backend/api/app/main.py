from fastapi import FastAPI
from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine
from app.routers.github import router as github_router
from app.routers.health import router as health_router

app = FastAPI(title="Portfolio Backend API", version="1.0.0")


def _ensure_project_media_columns() -> None:
    statements = (
        'ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS screenshots JSONB',
        'ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS videos JSONB',
    )
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    try:
        _ensure_project_media_columns()
    except Exception:
        # Local sqlite / older engines: ignore; create_all covers fresh DBs.
        pass


app.include_router(health_router)
app.include_router(github_router)
