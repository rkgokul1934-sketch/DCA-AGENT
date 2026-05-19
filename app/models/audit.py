# pyrefly: ignore [missing-import]
from sqlalchemy import String, Integer, Text, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin

class AuditLog(Base, TimestampMixin):
    """
    Immutable audit trail for enterprise-grade compliance and transparency.
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    event_type: Mapped[str] = mapped_column(String(100), index=True) # booking_created, lead_scored, rep_assigned
    entity_type: Mapped[str] = mapped_column(String(50)) # booking, lead, session
    entity_id: Mapped[int] = mapped_column(Integer)
    
    actor: Mapped[str] = mapped_column(String(100)) # system, user, agent
    action_details: Mapped[str] = mapped_column(Text)
    
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict) # For storing the "Why" (e.g. AI scores)
