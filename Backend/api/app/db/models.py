from datetime import datetime
from sqlalchemy import DateTime, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Project(Base):
    __tablename__ = "Project"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[dict] = mapped_column(JSON, nullable=False)
    description: Mapped[dict] = mapped_column(JSON, nullable=False)
    goal: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    role: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    stack: Mapped[str] = mapped_column(String(500), nullable=False)
    tag: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    demo_url: Mapped[str | None] = mapped_column("demo_url", String(500), nullable=True)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column("sort_order", Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=False), insert_default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=False),
        insert_default=func.now(),
        onupdate=func.now(),
        server_default=func.now(),
    )


class Service(Base):
    __tablename__ = "Service"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    external_id: Mapped[str | None] = mapped_column("externalId", String(100), nullable=True, unique=True)
    title: Mapped[dict] = mapped_column(JSON, nullable=False)
    description: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=False), insert_default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=False),
        insert_default=func.now(),
        onupdate=func.now(),
        server_default=func.now(),
    )


class Skill(Base):
    __tablename__ = "Skill"
    __table_args__ = (UniqueConstraint("category", "name", name="Skill_category_name_key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=False), insert_default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=False),
        insert_default=func.now(),
        onupdate=func.now(),
        server_default=func.now(),
    )
