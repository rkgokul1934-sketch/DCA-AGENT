# pyrefly: ignore [missing-import]
from sqlalchemy import String, Integer, Float, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin

class Competitor(Base, TimestampMixin):
    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)


    competitor_name: Mapped[str] = mapped_column(String(255), unique=True)
    pricing: Mapped[dict] = mapped_column(JSON)
    features: Mapped[list] = mapped_column(JSON)
    ai_capabilities: Mapped[dict] = mapped_column(JSON)
    integrations: Mapped[list] = mapped_column(JSON)
    pros: Mapped[list] = mapped_column(JSON)
    cons: Mapped[list] = mapped_column(JSON)
    score: Mapped[float] = mapped_column(Float)
