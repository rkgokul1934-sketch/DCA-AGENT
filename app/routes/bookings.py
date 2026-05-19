from datetime import date

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.booking import booking_repo
from app.schemas.booking import BookingCreate, Booking as BookingSchema, RescheduleCreate, Reschedule as RescheduleSchema, AvailableSlot
from app.services.booking import booking_service
from typing import List, Optional

from app.utils.responses import create_response

router = APIRouter()


@router.post("/", response_model=BookingSchema)
async def create_booking(obj_in: BookingCreate, db: AsyncSession = Depends(get_db)):
    return await booking_service.book_demo(db, obj_in=obj_in)

@router.get("/available-slots", response_model=List[AvailableSlot])
async def get_available_slots(
    date: date = Query(..., description="Date to check available slots for"),
    db: AsyncSession = Depends(get_db)
):
    return await booking_service.get_available_slots(db, target_date=date)

@router.get("/{booking_id}", response_model=BookingSchema)
async def get_booking(booking_id: int, db: AsyncSession = Depends(get_db)):

    booking = await booking_repo.get(db, id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.get("/", response_model=None)
async def list_bookings(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    # Optimize query to include meeting type name
    from sqlalchemy import select
    from app.models.booking import Booking
    from sqlalchemy.orm import joinedload
    query = select(Booking).options(joinedload(Booking.meeting_type)).offset(skip).limit(limit)
    result = await db.execute(query)
    bookings = result.scalars().all()
    
    # Map to include meeting type name
    data = []
    for b in bookings:
        b_dict = {c.name: getattr(b, c.name) for c in b.__table__.columns}
        b_dict["meeting_type_name"] = b.meeting_type.name if b.meeting_type else "Unknown"
        data.append(b_dict)
    
    return {
        "status": "success",
        "message": "Operation successful",
        "data": data,
        "meta": {"skip": skip, "limit": limit, "count": len(data)}
    }


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: int, db: AsyncSession = Depends(get_db)):

    booking = await booking_repo.get(db, id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await booking_repo.update(db, db_obj=booking, obj_in={"status": "cancelled"})
    return {"message": "Booking cancelled successfully"}

from pydantic import BaseModel
class BookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    followup_status: Optional[str] = None
    sales_rep_id: Optional[int] = None

@router.put("/{booking_id}", response_model=BookingSchema)
async def update_booking(
    booking_id: int,
    obj_in: BookingUpdate,
    db: AsyncSession = Depends(get_db)
):
    booking = await booking_repo.get(db, id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_data = obj_in.model_dump(exclude_unset=True)
    updated_booking = await booking_repo.update(db, db_obj=booking, obj_in=update_data)
    return updated_booking

@router.put("/{booking_id}/reschedule", response_model=BookingSchema)
async def reschedule_booking(
    booking_id: int, 
    obj_in: RescheduleCreate, 
    db: AsyncSession = Depends(get_db)
):
    return await booking_service.reschedule_booking(db, booking_id=booking_id, obj_in=obj_in)

@router.get("/{booking_id}/reschedules", response_model=List[RescheduleSchema])
async def get_reschedule_history(booking_id: int, db: AsyncSession = Depends(get_db)):

    return await booking_repo.get_reschedules(db, booking_id=booking_id)

from pydantic import BaseModel
class MeetingAnalysisRequest(BaseModel):
    prospect_name: str
    summary: str
    next_steps: str

@router.post("/{booking_id}/analyze")
async def analyze_meeting(
    booking_id: int,
    request: MeetingAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Logs the autonomous AI post-meeting intelligence analysis.
    """
    from app.models.audit import AuditLog
    from sqlalchemy import select
    from app.models.booking import Booking
    
    # Get booking to log actual name
    booking = await db.get(Booking, booking_id)
    name = booking.name if booking else request.prospect_name
    
    audit = AuditLog(
        event_type="meeting_analyzed",
        entity_type="booking",
        entity_id=booking_id,
        actor="agent",
        action_details=f"AI Meeting Analysis completed for {name}: {request.summary} | Next Steps: {request.next_steps}",
        metadata_json={"summary": request.summary, "next_steps": request.next_steps}
    )
    db.add(audit)
    await db.commit()
    return {"status": "success", "message": "Meeting analysis logged to audit logs."}
