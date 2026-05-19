import asyncio
import uuid
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.booking import Booking, Reschedule
from app.models.competitor import Competitor
from app.services.auth import get_password_hash

async def seed_data():
    async with SessionLocal() as db:
        # Check if user already exists
        # pyrefly: ignore [missing-import]
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        if result.scalar_one_or_none():
            print("Seed data already exists.")
            return

        # Seed User
        admin_user = User(
            name="Admin User",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)

        # Seed Competitors
        competitors = [
            Competitor(
                competitor_name="Hubspot",
                pricing={"starter": "$50/mo", "pro": "$800/mo", "enterprise": "$3200/mo"},
                features=["CRM", "Sales Hub", "Marketing Hub", "Service Hub"],
                ai_capabilities={"content_assistant": True, "chatbots": True, "predictive_lead_scoring": True},
                integrations=["Gmail", "Outlook", "Slack", "Zapier"],
                pros=["All-in-one platform", "Strong ecosystem", "User-friendly"],
                cons=["Expensive at scale", "Steep learning curve for advanced features"],
                score=8.5
            ),
            Competitor(
                competitor_name="Calendly",
                pricing={"free": "$0", "standard": "$10/mo", "teams": "$16/mo"},
                features=["Scheduling", "Round Robin", "Group Meetings", "Workflows"],
                ai_capabilities={"smart_scheduling": True},
                integrations=["Google Calendar", "Outlook", "Zoom", "Stripe"],
                pros=["Simple UI", "Industry standard", "Great free tier"],
                cons=["Limited CRM features", "Basic AI"],
                score=9.0
            )
        ]
        db.add_all(competitors)
        await db.flush() # Flush to get competitor IDs if needed, though not needed for bookings

        # Seed Bookings
        from datetime import date, time, timedelta
        bookings = [
            Booking(
                name="Alice Johnson",
                email="alice@techcorp.com",
                company_name="TechCorp",
                meeting_title="Initial Consultation",
                booking_date=date.today() + timedelta(days=2),
                booking_time=time(10, 0),
                timezone="UTC",
                status="confirmed"
            ),
            Booking(
                name="Bob Smith",
                email="bob@startup.io",
                company_name="StartupIO",
                meeting_title="Partnership Discussion",
                booking_date=date.today() + timedelta(days=3),
                booking_time=time(14, 30),
                timezone="PST",
                status="rescheduled"
            )
        ]
        db.add_all(bookings)
        await db.flush()

        # Seed Reschedule History for Bob
        reschedule_history = Reschedule(
            booking_id=bookings[1].id,
            old_date=date.today() + timedelta(days=1),
            new_date=bookings[1].booking_date,
            old_time=time(11, 0),
            new_time=bookings[1].booking_time,
            reason="Previous meeting ran over"
        )
        db.add(reschedule_history)
        
        await db.commit()
        print("Seed data created successfully with bookings and history.")

if __name__ == "__main__":
    asyncio.run(seed_data())
