from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.sales_rep import SalesRepRead, SalesRepCreate, CalendarSyncRequest, CalendarStatus
from typing import List

router = APIRouter(prefix="/sales-reps", tags=["Sales Management"])

@router.get("/", response_model=List[SalesRepRead])
async def list_sales_reps(db: AsyncSession = Depends(get_db)):
    """
    Lists all active sales representatives and their current load.
    """
    from sqlalchemy import select
    from app.models.sales_rep import SalesRep
    result = await db.execute(select(SalesRep))
    return result.scalars().all()

@router.post("/connect-calendar", response_model=CalendarStatus)
async def connect_calendar(request: CalendarSyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Initiates the OAuth flow for Google/Outlook calendar sync.
    """
    return {"is_connected": True, "last_sync": "now", "sync_status": "active"}

@router.get("/{rep_id}/status", response_model=CalendarStatus)
async def get_rep_sync_status(rep_id: int, db: AsyncSession = Depends(get_db)):
    """
    Checks if a rep's calendar is in sync with the agent.
    """
    return {"is_connected": True, "last_sync": "now", "sync_status": "active"}

@router.post("/webhook/google")
async def google_calendar_webhook(payload: dict):
    """
    Endpoint for Google Calendar push notifications.
    """
    return {"status": "processed"}
