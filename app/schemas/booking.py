# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import List, Optional

class BookingBase(BaseModel):
    name: str
    email: EmailStr
    company_name: str
    meeting_title: str
    booking_date: date
    booking_time: time
    timezone: str
    status: str = "pending"
    provider: Optional[str] = "open"
    notes: Optional[str] = None
    tags: Optional[str] = None
    followup_status: Optional[str] = "pending"
    
    # Optional IDs for internal routing
    sales_rep_id: Optional[int] = None
    meeting_type_id: Optional[int] = None
    lead_profile_id: Optional[int] = None

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    email_preview: Optional[dict] = None
    meeting_link: Optional[str] = None
    external_event_id: Optional[str] = None
    room_id: Optional[str] = None

    class Config:
        from_attributes = True

class RescheduleBase(BaseModel):
    booking_id: int

    old_date: date
    new_date: date
    old_time: time
    new_time: time
    reason: Optional[str] = None

class RescheduleCreate(BaseModel):
    new_date: date
    new_time: time
    reason: Optional[str] = None

class Reschedule(RescheduleBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class AvailableSlot(BaseModel):
    date: date
    time: time
    available: bool
