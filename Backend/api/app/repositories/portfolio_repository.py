import uuid

from sqlalchemy.orm import Session

from app.db.models import Project, Service, Skill
from app.schemas.analyze import AnalyzeResponseData


def replace_all(db: Session, payload: AnalyzeResponseData) -> None:
    db.query(Project).delete()
    db.query(Service).delete()
    db.query(Skill).delete()

    for project in payload.projects:
        db.add(
            Project(
                id=str(uuid.uuid4()),
                title=project.title.model_dump(),
                description=project.description.model_dump(),
                stack=project.stack,
                tag=str(project.tag),
            )
        )

    for service in payload.services:
        db.add(
            Service(
                id=str(uuid.uuid4()),
                external_id=service.id,
                title=service.title.model_dump(),
                description=service.description.model_dump(),
            )
        )

    for skill_name in payload.skills.nocode:
        db.add(Skill(id=str(uuid.uuid4()), category="nocode", name=skill_name))
    for skill_name in payload.skills.ai:
        db.add(Skill(id=str(uuid.uuid4()), category="ai", name=skill_name))
    for skill_name in payload.skills.automation:
        db.add(Skill(id=str(uuid.uuid4()), category="automation", name=skill_name))


def fetch_projects(db: Session) -> list[Project]:
    return db.query(Project).order_by(Project.created_at.desc()).all()


def fetch_services(db: Session) -> list[Service]:
    return db.query(Service).order_by(Service.created_at.desc()).all()


def fetch_skills(db: Session) -> list[Skill]:
    return db.query(Skill).order_by(Skill.category.asc(), Skill.name.asc()).all()
