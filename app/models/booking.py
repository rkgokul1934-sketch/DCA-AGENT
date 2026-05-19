from datetime import date, time
# pyrefly: ignore [missing-import]
from sqlalchemy import String, Integer, Date, Time, ForeignKey, Text
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.sales_rep import SalesRep, MeetingType
    from app.models.lead import LeadProfile

class Booking(Base, TimestampMixin):
    """
    Core demo booking record, now integrated with Sales Reps and Lead Intelligence.
    """
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Relationships
    sales_rep_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("sales_reps.id"))
    meeting_type_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("meeting_types.id"))
    lead_profile_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("lead_profiles.id"))

    # Booking Details
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), index=True)
    company_name: Mapped[str] = mapped_column(String(255))
    meeting_title: Mapped[str] = mapped_column(String(255))
    
    booking_date: Mapped[date] = mapped_column(Date)
    booking_time: Mapped[time] = mapped_column(Time)
    timezone: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50), default="pending") 
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)
    followup_status: Mapped[str | None] = mapped_column(String(100), default="pending")

    # Lifecycle Tokens
    reschedule_token: Mapped[str | None] = mapped_column(String(100), unique=True)
    cancel_token: Mapped[str | None] = mapped_column(String(100), unique=True)
    meeting_link: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Meeting Provider Details
    provider: Mapped[str | None] = mapped_column(String(50), default="open")
    external_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    room_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Links
    sales_rep: Mapped["SalesRep"] = relationship("SalesRep", back_populates="bookings")
    meeting_type: Mapped["MeetingType"] = relationship("MeetingType", back_populates="bookings")
    lead_profile: Mapped["LeadProfile"] = relationship("LeadProfile", back_populates="bookings")
    reschedules: Mapped[List["Reschedule"]] = relationship("Reschedule", back_populates="booking")

class Reschedule(Base, TimestampMixin):
    __tablename__ = "reschedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"))

    old_date: Mapped[date] = mapped_column(Date)
    new_date: Mapped[date] = mapped_column(Date)
    old_time: Mapped[time] = mapped_column(Time)
    new_time: Mapped[time] = mapped_column(Time)
    reason: Mapped[str | None] = mapped_column(Text)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="reschedules")
