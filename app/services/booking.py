from datetime import date, time, datetime, timedelta
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio   import AsyncSession
from app.repositories.booking import booking_repo
from app.schemas.booking import BookingCreate, RescheduleCreate, AvailableSlot

class BookingService:
    async def book_demo(self, db: AsyncSession, obj_in: BookingCreate):
        booking = await booking_repo.create(db, obj_in=obj_in)
        
        # Log to AuditLog for GTM Compliance
        try:
            from app.models.audit import AuditLog
            audit = AuditLog(
                event_type="booking_created",
                entity_type="booking",
                entity_id=booking.id,
                actor="prospect",
                action_details=f"Demo booked by {booking.name} ({booking.email}) for {booking.company_name} on {booking.booking_date} at {booking.booking_time}",
                metadata_json={"company": booking.company_name, "email": booking.email}
            )
            db.add(audit)
            await db.commit()
        except Exception as e:
            print(f"Failed to log booking audit: {e}")
        
        # ELITE: Handle Instant Confirmation — Real Email Delivery
        try:
            # Generate meeting via strategy pattern
            if not booking.meeting_link:
                from app.services.meeting_providers import MeetingProviderService
                provider_service = MeetingProviderService()
                
                details = {
                    "booking_id": booking.id,
                    "title": booking.meeting_title,
                    "email": booking.email,
                    "date": str(booking.booking_date),
                    "time": str(booking.booking_time)
                }
                
                # Default to open (Jitsi) if not provided
                provider_type = booking.provider if booking.provider else "open"
                
                meeting_info = provider_service.generate_meeting(provider_type, details)
                
                booking.meeting_link = meeting_info.get("meeting_url")
                booking.provider = meeting_info.get("provider")
                booking.external_event_id = meeting_info.get("external_event_id")
                booking.room_id = meeting_info.get("room_id")
                
                await db.commit()
                await db.refresh(booking)

            # Build premium HTML confirmation email
            from app.utils.email_templates import get_reminder_email_content
            from app.utils.email_sender import send_html_email
            email_data = get_reminder_email_content(booking, "confirmation")

            sent = send_html_email(
                to_email=booking.email,
                subject=email_data["subject"],
                html_body=email_data["body"]
            )

            # Always log for audit trail
            log_path = "/Users/apple/Documents/DCA-Agent/demo_emails.log"
            with open(log_path, "a") as f:
                f.write("\n" + "="*60 + "\n")
                f.write(f"📧 [EMAIL ENGINE] Confirmation → {booking.email}\n")
                f.write(f"   Subject : {email_data['subject']}\n")
                f.write(f"   Meeting : {booking.meeting_link}\n")
                f.write(f"   Sent    : {'✅ DELIVERED via SMTP' if sent else '⚠️ Logged only (SMTP not configured)'}\n")
                f.write("="*60 + "\n")
        except Exception as e:
            print(f"Confirmation Email Error: {e}")

        # Return the booking with the preview injected for the frontend
        booking_data = {c.name: getattr(booking, c.name) for c in booking.__table__.columns}
        booking_data["email_preview"] = {
            "to": booking.email,
            "subject": f"✅ Confirmed: {booking.meeting_title}",
            "body": f"Hi {booking.name}, your demo for {booking.company_name} is confirmed. Link: {booking.meeting_link}"
        }
        return booking_data

    async def reschedule_booking(self, db: AsyncSession, booking_id: int, obj_in: RescheduleCreate):
        booking = await booking_repo.get(db, id=booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if new slot is available
        existing = await booking_repo.get_by_date_and_time(
            db, booking_date=obj_in.new_date, booking_time=obj_in.new_time
        )
        if existing and existing.id != booking.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New slot is already booked"
            )
        
        # Save history
        await booking_repo.create_reschedule(
            db, 
            booking_id=booking.id, 
            old_date=booking.booking_date, 
            old_time=booking.booking_time, 
            obj_in=obj_in
        )
        
        # Update booking
        update_data = {
            "booking_date": obj_in.new_date,
            "booking_time": obj_in.new_time,
            "status": "rescheduled"
        }
        res = await booking_repo.update(db, db_obj=booking, obj_in=update_data)
        
        # Log to AuditLog for GTM Compliance
        try:
            from app.models.audit import AuditLog
            audit = AuditLog(
                event_type="booking_rescheduled",
                entity_type="booking",
                entity_id=booking.id,
                actor="prospect",
                action_details=f"Demo rescheduled by {booking.name} to {obj_in.new_date} at {obj_in.new_time}",
                metadata_json={"old_date": str(booking.booking_date), "new_date": str(obj_in.new_date)}
            )
            db.add(audit)
            await db.commit()
        except Exception as e:
            print(f"Failed to log reschedule audit: {e}")
            
        # Provider sync
        if booking.provider and booking.external_event_id:
            from app.services.meeting_providers import MeetingProviderService
            provider_service = MeetingProviderService()
            # In a full implementation, we'd call an update_meeting method on the provider here.
            # For this MVP, we simulate provider sync:
            print(f"Syncing reschedule for {booking.provider} event {booking.external_event_id}")

        return res

    async def cancel_booking(self, db: AsyncSession, booking_id: int):
        booking = await booking_repo.get(db, id=booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Provider cancellation
        if booking.provider and booking.external_event_id:
            from app.services.meeting_providers import MeetingProviderService
            provider_service = MeetingProviderService()
            provider_service.cancel_meeting(booking.provider, booking.external_event_id)

        update_data = {"status": "canceled"}
        res = await booking_repo.update(db, db_obj=booking, obj_in=update_data)

        # Notify Customer (simulated)
        print(f"Notified customer {booking.email} of meeting cancellation.")

        return res

    async def get_available_slots(self, db: AsyncSession, target_date: date):
        # Mock logic: 9 AM to 5 PM, every 30 mins
        slots = []
        start_time = time(9, 0)
        end_time = time(17, 0)
        
        current_time = datetime.combine(target_date, start_time)
        while current_time.time() < end_time:
            booking = await booking_repo.get_by_date_and_time(
                db, booking_date=target_date, booking_time=current_time.time()
            )
            slots.append(AvailableSlot(
                date=target_date,
                time=current_time.time(),
                available=booking is None
            ))
            current_time += timedelta(minutes=30)
        
        return slots

booking_service = BookingService()
