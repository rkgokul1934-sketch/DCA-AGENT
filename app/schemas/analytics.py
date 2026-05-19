from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional, Dict

class ConversionStats(BaseModel):
    total_chats: int
    total_bookings: int
    conversion_rate: float
    avg_lead_score: float
    traffic_sessions: Optional[int] = 0
    qualified_leads: Optional[int] = 0
    total_sessions: Optional[int] = 0

class RepPerformance(BaseModel):
    rep_name: str
    total_meetings: int
    no_show_rate: float
    avg_customer_rating: Optional[float]

class AuditLogRead(BaseModel):
    id: int
    event_type: str
    entity_type: str
    entity_id: int
    actor: str
    action_details: str
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    period: str
    stats: ConversionStats
    top_reps: List[RepPerformance]
    recent_audits: List[AuditLogRead]
