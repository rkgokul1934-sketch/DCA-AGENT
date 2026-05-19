from app.database import redis_client
import json
from typing import Optional, Any

class CacheService:
    def __init__(self):
        self.memory_cache = {}

    async def get(self, key: str) -> Optional[Any]:
        if redis_client:
            try:
                data = await redis_client.get(key)
                return json.loads(data) if data else None
            except Exception:
                pass
        return self.memory_cache.get(key)

    async def set(self, key: str, value: Any, expire: int = 86400):
        if redis_client:
            try:
                await redis_client.set(key, json.dumps(value), ex=expire)
                return
            except Exception:
                pass
        self.memory_cache[key] = value

cache_service = CacheService()
