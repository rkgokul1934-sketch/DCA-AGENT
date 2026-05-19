import redis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class SlotLockingService:
    """
    Handles temporary slot reservations using Redis to prevent double-bookings.
    """
    def __init__(self):
        # Using the same redis connection as Celery/Cache
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.lock_prefix = "slot_lock:"
        self.hold_duration = 300 # 5 minutes

    def hold_slot(self, rep_id: int, date_str: str, time_str: str) -> bool:
        """
        Attempts to put a temporary hold on a slot.
        Returns True if successful, False if already locked.
        """
        lock_key = f"{self.lock_prefix}{rep_id}:{date_str}:{time_str}"
        # setnx (set if not exists) with expiration
        success = self.redis_client.set(lock_key, "held", ex=self.hold_duration, nx=True)
        return bool(success)

    def release_slot(self, rep_id: int, date_str: str, time_str: str):
        """
        Explicitly removes a slot hold.
        """
        lock_key = f"{self.lock_prefix}{rep_id}:{date_str}:{time_str}"
        self.redis_client.delete(lock_key)

    def is_slot_locked(self, rep_id: int, date_str: str, time_str: str) -> bool:
        """
        Checks if a slot is currently held by someone else.
        """
        lock_key = f"{self.lock_prefix}{rep_id}:{date_str}:{time_str}"
        return self.redis_client.exists(lock_key) > 0

slot_locking_service = SlotLockingService()
