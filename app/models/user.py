# pyrefly: ignore [missing-import]
from sqlalchemy import String, Integer
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)


    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="user")
