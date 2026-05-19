from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
from datetime import datetime

class ContactBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    last_meeting: Optional[str] = None
    next_meeting: Optional[str] = None
    lead_source: Optional[str] = "Direct"
    owner: Optional[str] = "Sarah Jenkins"
    status: Optional[str] = "New"
    
    # Company Info
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    domain: Optional[str] = None
    revenue_segment: Optional[str] = None

    # Sales Ownership
    assigned_rep: Optional[str] = None
    team: Optional[str] = None
    account_owner: Optional[str] = None
    manager: Optional[str] = None
    ownership_transfer_history: Optional[Dict] = None

    # Follow-up
    follow_up_status: Optional[str] = "follow-up pending"
    next_action_date: Optional[str] = None
    pipeline_stage: Optional[str] = "Discovery"
    lead_health: Optional[str] = "Healthy"
    sales_priority: Optional[str] = "Medium"
    source_tracking: Optional[str] = None
    campaign_attribution: Optional[str] = None

    # Analytics
    conversion_score: Optional[float] = 70.0
    engagement_score: Optional[float] = 65.0
    booking_frequency: Optional[str] = "Monthly"
    response_rate: Optional[float] = 80.0
    lead_score: Optional[float] = 75.0
    ai_intent_score: Optional[float] = 60.0
    last_activity: Optional[str] = None

    # Extra
    notes: Optional[str] = None
    tags: Optional[str] = None
    timeline_activity: Optional[Dict] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class Contact(ContactBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
