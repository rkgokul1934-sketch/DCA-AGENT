# pyrefly: ignore [missing-import]
from sqlalchemy import String, Integer, Text, JSON, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin
from datetime import datetime

class ConversationSession(Base, TimestampMixin):
    """
    Persists the state of an ongoing discovery conversation.
    """
    __tablename__ = "conversation_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    
    current_step: Mapped[str] = mapped_column(String(50), default="discovery")
    collected_answers: Mapped[dict] = mapped_column(JSON, default=dict)
    
    last_message_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50), default="active") # active, completed, abandoned
    
    # Metadata for the agent's memory
    context_window: Mapped[dict] = mapped_column(JSON, default=dict)
