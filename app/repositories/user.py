from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> User | None:
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        return result.scalar_one_or_none()

user_repo = UserRepository(User)
