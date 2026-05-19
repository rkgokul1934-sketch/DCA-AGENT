# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.agent.orchestrator import agent_orchestrator
from app.agent.memory import agent_memory

router = APIRouter()

class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@router.post("/chat")
@router.post("/chat/start")
@router.post("/chat/respond")
async def agent_chat(
    request: AgentChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Conversational endpoint for the AI Agent.
    Handles GTM Discovery, Lead Scoring, and Market Intelligence.
    """
    response = await agent_orchestrator.run_goal(
        request.message, 
        db, 
        session_id=request.session_id
    )
    return response

# @router.get("/memory")
# async def get_agent_memory(query: str = None):
#     """
#     Retrieves knowledge from the agent's long-term memory.
#     """
#     if query:
#         return await agent_memory.search_memory(query)
#     return {"message": "Provide a query to search memory"}
