# pyrefly: ignore [missing-import]
from sqlalchemy import String, Integer, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin

class AvailabilitySetting(Base, TimestampMixin):
    """
    Saves Calendly-style availability control parameters (e.g. weekly hours, limits, overrides).
    """
    __tablename__ = "availability_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
