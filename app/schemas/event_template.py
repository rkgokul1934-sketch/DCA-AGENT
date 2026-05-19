from pydantic import BaseModel, Field
from typing import List, Optional


class EventTemplateBase(BaseModel):
    title: str
    slug: str
    duration: int = 30
    provider: str = "open"
    meeting_type: str = "one-on-one"
    availability: str = "Weekdays (9am-5pm)"
    color: str = "#6366f1"
    active: bool = True
    description: Optional[str] = None
    approval_type: str = "auto"
    questions: Optional[List[str]] = []
    revenue_attributed: str = "$0"


class EventTemplateCreate(EventTemplateBase):
    pass


class EventTemplateUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    duration: Optional[int] = None
    provider: Optional[str] = None
    meeting_type: Optional[str] = None
    availability: Optional[str] = None
    color: Optional[str] = None
    active: Optional[bool] = None
    description: Optional[str] = None
    approval_type: Optional[str] = None
    questions: Optional[List[str]] = None
    revenue_attributed: Optional[str] = None


class EventTemplateRead(EventTemplateBase):
    id: int
    bookings_count: int = 0

    model_config = {"from_attributes": True}


class SchedulingStats(BaseModel):
    total_pipeline: str
    total_bookings: int
    routing_qualified_pct: float
    ai_accuracy_pct: float
    top_event_type: str
    top_event_bookings: int
    active_templates: int
