from app.services.research_service import research_service
from app.services.crawler_service import crawler_service
from app.services.llm_analysis_service import llm_analysis_service
from app.services.scoring_service import scoring_service
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CompetitorTools:
    """
    Registry of tools available to the AI Agent.
    Strictly ID-Based as requested.
    """
    
    async def web_search(self, company_name: str, url: str = None) -> Dict[str, str]:
        return await research_service.discover_company_assets(company_name, url)

    async def read_website(self, url: str, company_name: str) -> str:
        return await crawler_service.crawl_url(url, company_name)

    async def extract_intelligence(self, company_name: str, texts: List[str]) -> Dict[str, Any]:
        return await llm_analysis_service.analyze_company_data(company_name, texts)

    async def calculate_market_scores(self, data: Dict[str, Any]) -> Dict[str, float]:
        return scoring_service.calculate_scores(data)

    async def compare_strategic_data(self, our_data: Dict[str, Any], comp_data: Dict[str, Any]) -> Dict[str, Any]:
        return await llm_analysis_service.compare_companies(our_data, comp_data)

    async def schedule_demo(self, db, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        from app.services.booking_service import booking_service
        return await booking_service.create_booking_from_agent(db, booking_data)

    async def get_booking_details_by_id(self, db, booking_id: int) -> Dict[str, Any]:
        """
        Tool: Retrieves booking details strictly by Booking ID.
        """
        from app.repositories.booking import booking_repo
        logger.info(f"Agent Action: Looking up booking #{booking_id}")
        
        booking = await booking_repo.get(db, id=booking_id)
        if not booking:
            return {"success": False, "message": f"Booking #{booking_id} not found."}
            
        return {
            "success": True,
            "name": booking.name,
            "company": booking.company_name,
            "date": str(booking.booking_date),
            "time": str(booking.booking_time),
            "status": booking.status
        }

    async def reschedule_demo_by_id(self, db, booking_id: int, reschedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tool: Reschedules a booking strictly by Booking ID.
        """
        from app.services.booking import booking_service
        from app.repositories.booking import booking_repo
        from app.schemas.booking import RescheduleCreate
        
        logger.info(f"Agent Action: Rescheduling booking #{booking_id}")
        
        booking = await booking_repo.get(db, id=booking_id)
        if not booking:
            return {"success": False, "message": f"Booking #{booking_id} not found."}

        try:
            obj_in = RescheduleCreate(
                new_date=datetime.strptime(reschedule_data["new_date"], "%Y-%m-%d").date(),
                new_time=datetime.strptime(reschedule_data["new_time"], "%H:%M").time(),
                reason=reschedule_data.get("reason", "Rescheduled via AI Agent (ID Flow)")
            )
            await booking_service.reschedule_booking(db, booking_id=booking.id, obj_in=obj_in)
            
            return {
                "success": True, 
                "message": f"Booking #{booking_id} successfully moved."
            }
        except Exception as e:
            return {"success": False, "message": str(e)}

agent_tools = CompetitorTools()
