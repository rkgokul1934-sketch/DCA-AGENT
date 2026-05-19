# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: str | None = None

class User(UserBase):
    id: int
    created_at: datetime


    class Config:
        from_attributes = True
