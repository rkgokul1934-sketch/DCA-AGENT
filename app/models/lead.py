from sqlalchemy import String, Integer, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin
from typing import List

class LeadProfile(Base, TimestampMixin):
    """
    Stores raw information collected from the lead during discovery.
    """
    __tablename__ = "lead_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), index=True)
    company_name: Mapped[str] = mapped_column(String(255))
    company_size: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str | None] = mapped_column(String(100))
    use_case: Mapped[str | None] = mapped_column(Text)
    raw_data: Mapped[dict] = mapped_column(JSON, default=dict) # For flexibility

    scores: Mapped[List["LeadScore"]] = relationship("LeadScore", back_populates="profile")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="lead_profile")

class LeadScore(Base, TimestampMixin):
    """
    Stores AI-calculated scores and routing decisions.
    """
    __tablename__ = "lead_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_profile_id: Mapped[int] = mapped_column(Integer, ForeignKey("lead_profiles.id"))
    
    score: Mapped[float] = mapped_column(Float) # 0-100
    classification: Mapped[str] = mapped_column(String(50)) # vip, standard, nurture
    reasoning: Mapped[str] = mapped_column(Text)
    routing_result: Mapped[str] = mapped_column(String(100)) # e.g. "assigned_to_rep_4"

    profile: Mapped["LeadProfile"] = relationship("LeadProfile", back_populates="scores")
