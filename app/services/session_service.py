from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.session import ConversationSession
from datetime import datetime
import uuid
import json

class SessionService:
    """
    Manages the lifecycle and state of AI discovery conversations.
    """
    
    async def get_or_create_session(self, session_id: str, db: AsyncSession) -> ConversationSession:
        result = await db.execute(
            select(ConversationSession).where(ConversationSession.session_id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            session = ConversationSession(
                session_id=session_id,
                current_step="discovery_init",
                collected_answers={},
                status="active"
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)
            
        return session

    async def update_session(self, session_id: str, step: str, answers: dict, db: AsyncSession):
        result = await db.execute(
            select(ConversationSession).where(ConversationSession.session_id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if session:
            session.current_step = step
            # Merge new answers into existing ones
            existing_answers = session.collected_answers or {}
            existing_answers.update(answers)
            session.collected_answers = existing_answers
            session.last_message_at = datetime.utcnow()
            
            await db.commit()
            return session
        return None

    async def complete_session(self, session_id: str, db: AsyncSession):
        result = await db.execute(
            select(ConversationSession).where(ConversationSession.session_id == session_id)
        )
        session = result.scalar_one_or_none()
        if session:
            session.status = "completed"
            await db.commit()

session_service = SessionService()
