from sqlalchemy import String, Integer, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin
from typing import List

class SalesRep(Base, TimestampMixin):
    """
    Sales representative profile and scheduling availability.
    """
    __tablename__ = "sales_reps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    working_hours: Mapped[dict] = mapped_column(JSON) # e.g. {"mon": ["09:00", "18:00"], ...}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    calendar_connection: Mapped["CalendarConnection"] = relationship("CalendarConnection", back_populates="sales_rep", uselist=False)
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="sales_rep")

class CalendarConnection(Base, TimestampMixin):
    """
    OAuth credentials for Google/Outlook calendar synchronization.
    """
    __tablename__ = "calendar_connections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sales_rep_id: Mapped[int] = mapped_column(Integer, ForeignKey("sales_reps.id"))
    
    provider: Mapped[str] = mapped_column(String(50)) # google, outlook
    refresh_token: Mapped[str] = mapped_column(Text)
    access_token: Mapped[str] = mapped_column(Text)
    expiry: Mapped[int] = mapped_column(Integer)
    sync_status: Mapped[str] = mapped_column(String(50), default="active")

    sales_rep: Mapped["SalesRep"] = relationship("SalesRep", back_populates="calendar_connection")

class MeetingType(Base, TimestampMixin):
    """
    Catalog of available meeting types and their associated rules.
    """
    __tablename__ = "meeting_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100)) # e.g. "Discovery Call"
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=10)
    description: Mapped[str | None] = mapped_column(Text)
    
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="meeting_type")
