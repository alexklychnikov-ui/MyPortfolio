import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import verify_internal_key
from app.core.config import settings
from app.db.session import get_db
from app.core.skill_categories import empty_skills_grouped
from app.repositories.portfolio_repository import fetch_projects, fetch_services, fetch_skills, replace_all
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, ExportStatus
from app.schemas.mockup import CreatePngData, CreatePngRequest, CreatePngResponse
from app.services.portfolio_service import PortfolioService
from app.services.project_mockup_service import ProjectMockupService
from app.services.static_exporter import export_public_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["github"])


@router.post("/github/analyze", dependencies=[Depends(verify_internal_key)], response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)):
    service = PortfolioService()
    try:
        data, skipped = await service.analyze_repositories([str(url) for url in payload.repositories])
        with db.begin():
            replace_all(db, data)

        export_status = ExportStatus(ok=True, error=None, services_count=len(data.services))
        if settings.static_export_dir:
            try:
                project_rows = fetch_projects(db)
                service_rows = fetch_services(db)
                skill_rows = fetch_skills(db)
                meta = export_public_data(
                    project_rows, service_rows, skill_rows, settings.static_export_dir
                )
                export_status = ExportStatus(
                    ok=True,
                    error=None,
                    services_count=int(meta.get("services_count") or 0),
                )
            except Exception as export_exc:
                logger.exception("static_export_failed after DB replace_all")
                export_status = ExportStatus(ok=False, error=str(export_exc), services_count=None)
                return {
                    "success": False,
                    "data": data,
                    "skipped": skipped,
                    "export": export_status,
                }

        return {
            "success": True,
            "data": data,
            "skipped": skipped,
            "export": export_status,
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/github/create-png", dependencies=[Depends(verify_internal_key)], response_model=CreatePngResponse)
async def create_png(payload: CreatePngRequest):
    service = ProjectMockupService()
    try:
        result = await service.create_png_for_repository(str(payload.repository))
        return {"success": True, "data": CreatePngData.model_validate(result)}
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
    grouped = empty_skills_grouped()
    for row in rows:
        if row.category in grouped:
            grouped[row.category].append(row.name)
    return {"success": True, "data": grouped}
