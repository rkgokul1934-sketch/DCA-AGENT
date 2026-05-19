from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.competitor import Competitor
from app.schemas.competitor import CompetitorCreate, Competitor as CompetitorSchema
from app.repositories.base import BaseRepository

class CompetitorRepository(BaseRepository[Competitor, CompetitorCreate, CompetitorSchema]):
    async def get_by_name(self, db: AsyncSession, *, name: str) -> Competitor | None:
        query = select(Competitor).where(Competitor.competitor_name == name)
        result = await db.execute(query)
        return result.scalar_one_or_none()

competitor_repo = CompetitorRepository(Competitor)
