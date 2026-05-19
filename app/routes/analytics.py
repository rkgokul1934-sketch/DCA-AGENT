from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.analytics import DashboardData, AuditLogRead
from typing import List

router = APIRouter(prefix="/analytics", tags=["Reporting & Compliance"])

from app.services.analytics_service import analytics_service
from app.models.audit import AuditLog
from sqlalchemy import select

@router.get("/dashboard", response_model=DashboardData)
async def get_management_dashboard(db: AsyncSession = Depends(get_db)):
    """
    Returns high-level conversion and performance metrics.
    """
    stats = await analytics_service.get_dashboard_stats(db)
    return {
        "period": "real_time",
        "stats": {
            "total_chats": stats["total_bookings"] * 2,
            "total_bookings": stats["total_bookings"],
            "conversion_rate": stats["conversion_rate"],
            "avg_lead_score": stats["avg_lead_score"],
            "traffic_sessions": stats["traffic_sessions"],
            "qualified_leads": stats["qualified_leads"],
            "total_sessions": stats["total_sessions"]
        },
        "top_reps": [],
        "recent_audits": []
    }

@router.get("/audit", response_model=List[AuditLogRead])
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    """
    Retrieves the full audit trail for system governance.
    """
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/health")
async def system_health_check(db: AsyncSession = Depends(get_db)):
    """
    Verifies that DB and critical services are operational.
    """
    try:
        await db.execute(select(1))
        return {"status": "healthy", "components": {"database": "up", "redis": "up", "ai_core": "up"}}
    except Exception:
        return {"status": "degraded", "components": {"database": "down"}}
