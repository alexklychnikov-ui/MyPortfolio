from fastapi import FastAPI

from app.db.base import Base
from app.db.session import engine
from app.routers.github import router as github_router
from app.routers.health import router as health_router

app = FastAPI(title="Portfolio Backend API", version="1.0.0")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(health_router)
app.include_router(github_router)
