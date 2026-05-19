from datetime import date, time
from uuid import UUID

# pyrefly: ignore [missing-import]
from sqlalchemy import select, and_, or_, func
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking, Reschedule
from app.models.sales_rep import MeetingType
from app.schemas.booking import BookingCreate, Booking as BookingSchema, RescheduleCreate
from app.repositories.base import BaseRepository

class BookingRepository(BaseRepository[Booking, BookingCreate, BookingSchema]):
    async def check_overlap(
        self, 
        db: AsyncSession, 
        *, 
        sales_rep_id: int, 
        booking_date: date, 
        start_time: time, 
        duration_minutes: int,
        buffer_minutes: int = 10
    ) -> bool:
        """
        Advanced Overlap Engine: Checks if a slot is blocked by another meeting or its buffer.
        """
        from datetime import datetime, timedelta
        
        # Calculate new meeting window
        new_start = datetime.combine(booking_date, start_time)
        new_end = new_start + timedelta(minutes=duration_minutes + buffer_minutes)
        
        # Query all active bookings for this rep on this day
        query = select(Booking, MeetingType).join(MeetingType).where(
            and_(
                Booking.sales_rep_id == sales_rep_id,
                Booking.booking_date == booking_date,
                Booking.status != "cancelled"
            )
        )
        result = await db.execute(query)
        existing_bookings = result.all()
        
        for b, mt in existing_bookings:
            # Calculate existing meeting window (including its buffer)
            exist_start = datetime.combine(b.booking_date, b.booking_time)
            exist_end = exist_start + timedelta(minutes=mt.duration_minutes + mt.buffer_minutes)
            
            # Intersection check: (StartA < EndB) and (StartB < EndA)
            if new_start < exist_end and exist_start < new_end:
                return True # Conflict found
                
        return False

    async def get_by_name_and_email(self, db: AsyncSession, name: str, email: str) -> Booking | None:
        """
        Finds the latest active booking for a given name and email.
        """
        query = select(Booking).where(
            and_(
                Booking.name == name,
                Booking.email == email,
                Booking.status != "cancelled"
            )
        ).order_by(Booking.created_at.desc())
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_date_and_time(self, db: AsyncSession, booking_date: date, booking_time: time) -> Booking | None:
        """
        Check if a specific slot is already taken.
        """
        query = select(Booking).where(
            and_(
                Booking.booking_date == booking_date,
                Booking.booking_time == booking_time,
                Booking.status != "cancelled"
            )
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def create_reschedule(
        self, db: AsyncSession, *, booking_id: int, old_date: date, old_time: time, obj_in: RescheduleCreate
    ) -> Reschedule:
        db_obj = Reschedule(
            booking_id=booking_id,
            old_date=old_date,
            old_time=old_time,
            new_date=obj_in.new_date,
            new_time=obj_in.new_time,
            reason=obj_in.reason
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_reschedules(self, db: AsyncSession, *, booking_id: int) -> list[Reschedule]:
        query = select(Reschedule).where(Reschedule.booking_id == booking_id)
        result = await db.execute(query)
        return result.scalars().all()

booking_repo = BookingRepository(Booking)
