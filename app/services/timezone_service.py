from datetime import datetime, time, date, timedelta
import pytz
from typing import List, Dict
from app.schemas.scheduling import AvailableSlot

class TimezoneService:
    """
    Handles global timezone conversions and smart slot recommendations.
    """
    
    def convert_to_utc(self, local_date: date, local_time: time, tz_name: str) -> datetime:
        tz = pytz.timezone(tz_name)
        local_dt = tz.localize(datetime.combine(local_date, local_time))
        return local_dt.astimezone(pytz.UTC)

    def convert_from_utc(self, utc_dt: datetime, target_tz_name: str) -> datetime:
        target_tz = pytz.timezone(target_tz_name)
        return utc_dt.astimezone(target_tz)

    def rank_slots(self, slots: List[Dict], user_tz: str, lead_score: float) -> List[AvailableSlot]:
        """
        AI-driven ranking logic:
        - Prioritizes slots during user's morning/afternoon.
        - Prioritizes faster conversion if lead_score is high.
        """
        ranked_slots = []
        for slot in slots:
            # Simple heuristic for now: 
            # 1. Is it during user's working hours (9-5)?
            # 2. Is it soon?
            is_recommended = False
            reason = None
            
            user_hour = slot["user_time"].hour
            if 9 <= user_hour <= 17:
                is_recommended = True
                reason = "Aligns perfectly with your business hours."
            
            if lead_score > 80 and not is_recommended:
                is_recommended = True
                reason = "Fastest available strategic slot."

            ranked_slots.append(AvailableSlot(
                start_time=slot["user_time"].time(),
                end_time=(datetime.combine(date.today(), slot["user_time"].time()) + timedelta(minutes=30)).time(),
                is_recommended=is_recommended,
                recommendation_reason=reason
            ))
            
        # Sort so recommended are first
        return sorted(ranked_slots, key=lambda x: x.is_recommended, reverse=True)

timezone_service = TimezoneService()
