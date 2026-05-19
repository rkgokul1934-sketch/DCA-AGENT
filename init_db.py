import asyncio
from app.database import engine, Base
from app.models.user import User
from app.models.booking import Booking, Reschedule
from app.models.competitor import Competitor
from app.models.availability import AvailabilitySetting

async def init_db():
    async with engine.begin() as conn:
        # Import models here to ensure they are registered with Base.metadata
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")

if __name__ == "__main__":
    asyncio.run(init_db())
