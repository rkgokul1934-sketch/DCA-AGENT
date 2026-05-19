from app.repositories.booking import booking_repo
from app.schemas.scheduling import BookingRequest
from app.services.slot_locking_service import slot_locking_service
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sales_rep import MeetingType, SalesRep
from datetime import datetime, date, time, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)

class BookingService:
    async def create_enterprise_booking(self, db: AsyncSession, request: BookingRequest):
        """
        GTM Core: Handles booking with Lead Intel, Slot Locking, and Duration logic.
        """
        try:
            # 1. Fetch Meeting Type Configuration
            mt_query = select(MeetingType).where(MeetingType.slug == request.meeting_type_slug)
            result = await db.execute(mt_query)
            meeting_type = result.scalar_one_or_none()
            if not meeting_type:
                return {"success": False, "message": "Invalid meeting type selected."}

            # 2. Strategic Rep Assignment (Round-Robin logic placeholder)
            # For Phase 2, we pick the first active rep
            rep_query = select(SalesRep).where(SalesRep.is_active == True)
            rep_result = await db.execute(rep_query)
            rep = rep_result.scalars().first()
            if not rep:
                return {"success": False, "message": "No sales representatives available."}

            # 3. Race-Condition Protection: Redis Hold
            date_str = request.booking_date.strftime("%Y-%m-%d")
            time_str = request.booking_time.strftime("%H:%M")
            
            if not slot_locking_service.hold_slot(rep.id, date_str, time_str):
                return {"success": False, "message": "This slot was just taken by someone else. Please try another."}

            # 4. Advanced Overlap Check
            is_blocked = await booking_repo.check_overlap(
                db,
                sales_rep_id=rep.id,
                booking_date=request.booking_date,
                start_time=request.booking_time,
                duration_minutes=meeting_type.duration_minutes,
                buffer_minutes=meeting_type.buffer_minutes
            )
            
            if is_blocked:
                slot_locking_service.release_slot(rep.id, date_str, time_str)
                return {"success": False, "message": "Conflict detected with another booking. Please select a different time."}

            # 5. Atomic Creation
            from app.models.booking import Booking
            import urllib.parse
            title_enc = urllib.parse.quote(f"{meeting_type.name}: {request.company_name}")
            new_booking = Booking(
                name=request.name,
                email=request.email,
                company_name=request.company_name,
                meeting_title=f"{meeting_type.name}: {request.company_name}",
                booking_date=request.booking_date,
                booking_time=request.booking_time,
                timezone=request.timezone,
                sales_rep_id=rep.id,
                meeting_type_id=meeting_type.id,
                meeting_link=f"http://localhost:5173/meeting.html?title={title_enc}",
                reschedule_token=str(uuid.uuid4()),
                cancel_token=str(uuid.uuid4())
            )
            
            db.add(new_booking)
            await db.commit()
            await db.refresh(new_booking)
            
            # 6. DEMO MODE: Send Instant Confirmation Synchronously (Direct Write)
            try:
                log_path = "/tmp/demo_emails.log"
                with open(log_path, "a") as f:
                    f.write("\n" + "="*50 + "\n")
                    f.write(f"📧 [ELITE EMAIL ENGINE] Direct Confirmation to: {new_booking.email}\n")
                    f.write(f"Subject: ✅ Confirmed: {new_booking.meeting_title}\n")
                    f.write(f"Meeting Link: {new_booking.meeting_link}\n")
                    f.write("-" * 50 + "\n")
                    f.write(f"Hi {new_booking.name}, your demo for {new_booking.company_name} is confirmed!\n")
                    f.write("="*50 + "\n")
                logger.info(f"✅ [DEMO MODE] Logged direct confirmation for Booking #{new_booking.id}")
            except Exception as e:
                logger.error(f"Failed to write direct log: {e}")
            
            # 6. Cleanup Lock
            slot_locking_service.release_slot(rep.id, date_str, time_str)
            
            return {
                "success": True, 
                "booking_id": new_booking.id, 
                "message": "Demo booked successfully!",
                "meeting_link": new_booking.meeting_link,
                "email_preview": {
                    "to": new_booking.email,
                    "subject": f"✅ Confirmed: {new_booking.meeting_title}",
                    "body": f"Hi {new_booking.name}, your demo for {new_booking.company_name} is confirmed at {new_booking.booking_time}. Link: {new_booking.meeting_link}"
                }
            }

        except Exception as e:
            logger.error(f"Enterprise Booking Failed: {e}")
            return {"success": False, "message": "Internal processing error."}

booking_service = BookingService()
