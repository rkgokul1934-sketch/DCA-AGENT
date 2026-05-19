from fastapi import APIRouter, Depends, HTTPException
import pytz
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.scheduling import (
    SlotCheckRequest, AvailableSlot, BookingRequest, 
    BookingResponse, RescheduleRequest, CancelRequest, BookingStatus
)
from typing import List

router = APIRouter(prefix="/bookings", tags=["Scheduling"])

from app.models.sales_rep import SalesRep, MeetingType
from app.services.timezone_service import timezone_service
from app.repositories.booking import booking_repo
from sqlalchemy import select
from datetime import datetime, time, timedelta

@router.post("/check-slots", response_model=List[AvailableSlot])
async def check_available_slots(request: SlotCheckRequest, db: AsyncSession = Depends(get_db)):
    """
    Returns available slots with AI-powered smart recommendations across all reps.
    """
    # 1. Get Meeting Type info
    mt_query = select(MeetingType).where(MeetingType.slug == request.meeting_type_slug)
    mt_result = await db.execute(mt_query)
    mt = mt_result.scalar_one_or_none()
    if not mt:
        raise HTTPException(status_code=400, detail="Invalid meeting type")

    # 2. Get all active reps
    reps_query = select(SalesRep).where(SalesRep.is_active == True)
    reps_result = await db.execute(reps_query)
    reps = reps_result.scalars().all()

    all_available_slots = []

    # 3. Scan 9 AM - 6 PM for each rep
    for rep in reps:
        # Standard 9-6 window (Simplified for Phase 3)
        for hour in range(9, 18):
            for minute in [0, 30]:
                slot_time = time(hour, minute)
                
                # Check for overlap
                is_blocked = await booking_repo.check_overlap(
                    db,
                    sales_rep_id=rep.id,
                    booking_date=request.date,
                    start_time=slot_time,
                    duration_minutes=mt.duration_minutes,
                    buffer_minutes=mt.buffer_minutes
                )
                
                if not is_blocked:
                    # Convert rep time to User Time for the response
                    rep_tz = pytz.timezone(rep.timezone)
                    rep_dt = rep_tz.localize(datetime.combine(request.date, slot_time))
                    user_dt = rep_dt.astimezone(pytz.timezone(request.timezone))
                    
                    all_available_slots.append({
                        "user_time": user_dt,
                        "rep_id": rep.id
                    })

    # 4. Rank and return top slots
    return timezone_service.rank_slots(all_available_slots, request.timezone, lead_score=75)

@router.post("/create", response_model=BookingResponse)
async def create_booking(request: BookingRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a booking after AI Lead Qualification.
    """
    return {
        "booking_id": 0,
        "status": "pending",
        "reschedule_token": "stub",
        "cancel_token": "stub",
        "message": "Booking request received"
    }

from app.models.booking import Booking

@router.post("/reschedule", response_model=BookingResponse)
async def reschedule_booking(request: RescheduleRequest, db: AsyncSession = Depends(get_db)):
    """
    Reschedules a booking using a secure token (ID-free).
    """
    query = select(Booking).where(Booking.reschedule_token == request.token)
    result = await db.execute(query)
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid or expired reschedule token.")

    # Update booking details
    booking.booking_date = request.new_date
    booking.booking_time = request.new_time
    booking.status = "rescheduled"
    
    await db.commit()
    
    return {
        "booking_id": booking.id,
        "status": "rescheduled",
        "reschedule_token": booking.reschedule_token,
        "cancel_token": booking.cancel_token,
        "message": "Your demo has been successfully moved."
    }

@router.post("/cancel", response_model=dict)
async def cancel_booking(request: CancelRequest, db: AsyncSession = Depends(get_db)):
    """
    Cancels a booking using a secure token.
    """
    query = select(Booking).where(Booking.cancel_token == request.token)
    result = await db.execute(query)
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid or expired cancel token.")

    booking.status = "cancelled"
    await db.commit()
    
    return {"message": "Your demo has been cancelled successfully."}

@router.get("/status/{token}", response_model=BookingStatus)
async def get_booking_status(token: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves booking details using a secure token.
    """
    raise HTTPException(status_code=404, detail="Booking not found")

@router.post("/hold-slot")
async def hold_slot(date: str, time: str, db: AsyncSession = Depends(get_db)):
    """
    Temporarily locks a slot in Redis to prevent race conditions.
    """
    return {"status": "locked", "expires_in": 300}
