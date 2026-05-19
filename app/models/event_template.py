from sqlalchemy import String, Integer, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin


class EventTemplate(Base, TimestampMixin):
    """
    Booking event template — the scheduling 'event type' record.
    Analogous to a Calendly Event Type with GTM extensions.
    """
    __tablename__ = "event_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    duration: Mapped[int] = mapped_column(Integer, default=30)          # minutes
    provider: Mapped[str] = mapped_column(String(50), default="open")   # google | zoom | teams | open
    meeting_type: Mapped[str] = mapped_column(String(100), default="one-on-one")
    availability: Mapped[str] = mapped_column(String(255), default="Weekdays (9am-5pm)")
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    approval_type: Mapped[str] = mapped_column(String(50), default="auto")  # auto | manual | manager
    questions: Mapped[list | None] = mapped_column(JSON, nullable=True)     # list of strings
    bookings_count: Mapped[int] = mapped_column(Integer, default=0)
    revenue_attributed: Mapped[str] = mapped_column(String(50), default="$0")
