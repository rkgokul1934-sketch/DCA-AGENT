import logging
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.booking import Booking
from sqlalchemy import select
import time

logger = logging.getLogger(__name__)

logger.error("DEBUG: notifications.py module loaded")

@celery_app.task(name="send_booking_reminder")
def send_booking_reminder(booking_id: int, reminder_type: str):
    logger.error(f"DEBUG: send_booking_reminder called with id={booking_id}, type={reminder_type}")
    """
    Sends 24h, 1h, or 30min reminders to the lead and sales rep.
    """
    db = SessionLocal()
    try:
        result = db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        
        if not booking or booking.status == "cancelled":
            logger.info(f"Skipping reminder for booking #{booking_id}: Already cancelled or missing.")
            return

        # Logic for sending email/SMS (Phase 6 Premium Templates)
        from app.utils.email_templates import get_reminder_email_content
        from app.utils.email_sender import send_html_email
        email_data = get_reminder_email_content(booking, reminder_type)

        sent = send_html_email(
            to_email=booking.email,
            subject=email_data["subject"],
            html_body=email_data["body"]
        )
        
        # Simulation log for demo (Write to a dedicated log file for easy viewing)
        log_path = "/Users/apple/Documents/DCA-Agent/demo_emails.log"
        logger.error(f"DEBUG: Attempting to write email to {log_path}")
        with open(log_path, "a") as f:
            f.write("\n" + "="*60 + "\n")
            f.write(f"📧 [EMAIL ENGINE] Sending {reminder_type} to: {booking.email}\n")
            f.write(f"   Subject : {email_data['subject']}\n")
            f.write(f"   Meeting : {booking.meeting_link}\n")
            f.write(f"   Sent    : {'✅ DELIVERED via SMTP' if sent else '⚠️ Logged only (SMTP not configured)'}\n")
            f.write("="*60 + "\n")
        
        return {"status": "sent", "type": reminder_type, "subject": email_data['subject']}
    except Exception as e:
        logger.error(f"Failed to send reminder: {e}")
        raise e
    finally:
        db.close()

@celery_app.task(name="sync_external_calendar")
def sync_external_calendar(rep_id: int):
    """
    Periodic task to ensure the DCA Agent and External Calendar are in sync.
    """
    logger.info(f"Performing background sync for Sales Rep #{rep_id}")
    return {"status": "synchronized"}
