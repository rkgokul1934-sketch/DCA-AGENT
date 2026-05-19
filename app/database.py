# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import DeclarativeBase
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
import redis.asyncio as redis
from app.config import settings

# PostgreSQL
engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# MongoDB
try:
    mongo_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    mongo_db = mongo_client[settings.MONGODB_DB_NAME]
except Exception:
    mongo_db = None
    print("MongoDB not available, raw data will not be saved.")

def get_mongo_db():
    return mongo_db

# Redis
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None
    print("Redis not available, caching and celery will be limited.")

async def get_redis():
    return redis_client
