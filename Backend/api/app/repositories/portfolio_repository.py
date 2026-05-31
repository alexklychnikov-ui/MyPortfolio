import uuid

from sqlalchemy.orm import Session

from app.core.skill_categories import SKILL_CATEGORIES
from app.db.models import Project, Service, Skill
from app.schemas.analyze import AnalyzeResponseData


def replace_all(db: Session, payload: AnalyzeResponseData) -> None:
    db.query(Project).delete()
    db.query(Service).delete()
    db.query(Skill).delete()

    for index, project in enumerate(payload.projects):
        db.add(
            Project(
                id=str(uuid.uuid4()),
                title=project.title.model_dump(),
                description=project.description.model_dump(),
                goal=project.goal.model_dump() if project.goal else None,
                role=project.role.model_dump() if project.role else None,
                result=project.result.model_dump() if project.result else None,
                stack=project.stack,
                tag=str(project.tag),
                demo_url=project.demoUrl,
                image=project.image,
                sort_order=index,
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

    skills_by_category = payload.skills.model_dump()
    for category in SKILL_CATEGORIES:
        for skill_name in skills_by_category.get(category, []):
            db.add(Skill(id=str(uuid.uuid4()), category=category, name=skill_name))


def fetch_projects(db: Session) -> list[Project]:
    return db.query(Project).order_by(Project.sort_order.asc(), Project.created_at.asc()).all()


def fetch_services(db: Session) -> list[Service]:
    return db.query(Service).order_by(Service.created_at.desc()).all()


def fetch_skills(db: Session) -> list[Skill]:
    return db.query(Skill).order_by(Skill.category.asc(), Skill.name.asc()).all()
