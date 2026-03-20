from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import verify_internal_key
from app.core.config import settings
from app.db.session import get_db
from app.repositories.portfolio_repository import fetch_projects, fetch_services, fetch_skills, replace_all
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.portfolio_service import PortfolioService
from app.services.static_exporter import export_public_data

router = APIRouter(prefix="/v1", tags=["github"])


@router.post("/github/analyze", dependencies=[Depends(verify_internal_key)], response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)):
    service = PortfolioService()
    try:
        data, skipped = await service.analyze_repositories([str(url) for url in payload.repositories])
        with db.begin():
            replace_all(db, data)
        if settings.static_export_dir:
            project_rows = fetch_projects(db)
            service_rows = fetch_services(db)
            skill_rows = fetch_skills(db)
            export_public_data(project_rows, service_rows, skill_rows, settings.static_export_dir)
        return {"success": True, "data": data, "skipped": skipped}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    rows = fetch_projects(db)
    data = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "stack": row.stack,
            "tag": row.tag,
        }
        for row in rows
    ]
    return {"success": True, "data": data}


@router.get("/services")
def get_services(db: Session = Depends(get_db)):
    rows = fetch_services(db)
    data = [
        {
            "id": row.id,
            "externalId": row.external_id,
            "title": row.title,
            "description": row.description,
        }
        for row in rows
    ]
    return {"success": True, "data": data}


@router.get("/skills")
def get_skills(db: Session = Depends(get_db)):
    rows = fetch_skills(db)
    grouped: dict[str, list[str]] = {"nocode": [], "ai": [], "automation": []}
    for row in rows:
        grouped.setdefault(row.category, []).append(row.name)
    return {"success": True, "data": grouped}
