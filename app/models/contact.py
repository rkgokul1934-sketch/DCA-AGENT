from sqlalchemy import String, Integer, Text, ForeignKey, JSON, Float, Date, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin
from datetime import date, datetime
from typing import Optional

class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), index=True, unique=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    company: Mapped[Optional[str]] = mapped_column(String(255))
    last_meeting: Mapped[Optional[str]] = mapped_column(String(100)) # e.g. "2026-06-01"
    next_meeting: Mapped[Optional[str]] = mapped_column(String(100)) # e.g. "2026-06-10"
    lead_source: Mapped[Optional[str]] = mapped_column(String(100), default="Direct")
    owner: Mapped[Optional[str]] = mapped_column(String(100), default="Sarah Jenkins")
    status: Mapped[Optional[str]] = mapped_column(String(100), default="New") # status/follow-up status

    # Company Info
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    company_size: Mapped[Optional[str]] = mapped_column(String(50))
    website: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    domain: Mapped[Optional[str]] = mapped_column(String(100))
    revenue_segment: Mapped[Optional[str]] = mapped_column(String(100))

    # Sales Ownership & Teams
    assigned_rep: Mapped[Optional[str]] = mapped_column(String(100))
    team: Mapped[Optional[str]] = mapped_column(String(100))
    account_owner: Mapped[Optional[str]] = mapped_column(String(100))
    manager: Mapped[Optional[str]] = mapped_column(String(100))
    ownership_transfer_history: Mapped[dict] = mapped_column(JSON, default=dict)

    # Follow-up & Pipeline Status
    follow_up_status: Mapped[Optional[str]] = mapped_column(String(100), default="follow-up pending") # contacted, follow-up pending, demo completed, proposal sent, closed won, closed lost
    next_action_date: Mapped[Optional[str]] = mapped_column(String(100))
    pipeline_stage: Mapped[Optional[str]] = mapped_column(String(100), default="Discovery")
    lead_health: Mapped[Optional[str]] = mapped_column(String(50), default="Healthy") # Healthy, Warning, Critical
    sales_priority: Mapped[Optional[str]] = mapped_column(String(50), default="Medium") # High, Medium, Low
    source_tracking: Mapped[Optional[str]] = mapped_column(String(255))
    campaign_attribution: Mapped[Optional[str]] = mapped_column(String(255))

    # Analytics Scores (AI-driven)
    conversion_score: Mapped[float] = mapped_column(Float, default=70.0)
    engagement_score: Mapped[float] = mapped_column(Float, default=65.0)
    booking_frequency: Mapped[Optional[str]] = mapped_column(String(50), default="Monthly")
    response_rate: Mapped[float] = mapped_column(Float, default=80.0)
    lead_score: Mapped[float] = mapped_column(Float, default=75.0)
    ai_intent_score: Mapped[float] = mapped_column(Float, default=60.0)
    last_activity: Mapped[Optional[str]] = mapped_column(String(100))

    # CRM Structure & Data
    notes: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[str]] = mapped_column(String(255)) # comma-separated
    timeline_activity: Mapped[dict] = mapped_column(JSON, default=dict)
