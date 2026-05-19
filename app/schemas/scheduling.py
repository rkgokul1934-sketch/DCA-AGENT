from pydantic import BaseModel, EmailStr, Field
from datetime import date, time, datetime
from typing import List, Optional

class SlotCheckRequest(BaseModel):
    date: date
    meeting_type_slug: str = "demo"
    timezone: str = "UTC"

class AvailableSlot(BaseModel):
    start_time: time
    end_time: time
    is_recommended: bool = False
    recommendation_reason: Optional[str] = None

class BookingRequest(BaseModel):
    # Discovery Info
    name: str
    email: EmailStr
    company_name: str
    company_size: Optional[str] = None
    role: Optional[str] = None
    use_case: Optional[str] = None
    
    # Selection
    meeting_type_slug: str
    booking_date: date
    booking_time: time
    timezone: str

class BookingResponse(BaseModel):
    booking_id: int
    status: str
    reschedule_token: str
    cancel_token: str
    message: str

class RescheduleRequest(BaseModel):
    token: str
    new_date: date
    new_time: time
    reason: Optional[str] = None

class CancelRequest(BaseModel):
    token: str
    reason: Optional[str] = None

class BookingStatus(BaseModel):
    id: int
    status: str
    date: date
    time: time
    rep_name: Optional[str]
    meeting_type: str
