from typing import List, Union, Optional
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Competitive Intelligence Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    # PostgreSQL
    DATABASE_URL: str

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: Optional[str] = None

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "competition_raw_data"

    # AI & Bedrock Keys
    BEDROCK_API_URL: str
    BEDROCK_API_KEY: str
    BEDROCK_MODEL: str
    SERPAPI_API_KEY: str

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Email / SMTP
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str = ""
    SMTP_PASSWORD: str = ""

    @validator("REDIS_URL", pre=True)
    def assemble_redis_url(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str):
            return v
        return f"redis://{values.get('REDIS_HOST')}:{values.get('REDIS_PORT')}/0"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
