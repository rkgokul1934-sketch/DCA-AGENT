from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict

class SalesRepBase(BaseModel):
    name: str
    email: EmailStr
    timezone: str
    working_hours: Dict[str, List[str]] # e.g. {"mon": ["09:00", "18:00"]}

class SalesRepCreate(SalesRepBase):
    pass

class SalesRepRead(SalesRepBase):
    id: int
    is_active: bool
    current_load: int = 0

    class Config:
        from_attributes = True

class CalendarSyncRequest(BaseModel):
    provider: str # google, outlook
    code: Optional[str] = "mock_code" # Auth code from OAuth flow
    email: Optional[str] = None

class CalendarStatus(BaseModel):
    is_connected: bool
    last_sync: Optional[str]
    sync_status: str
