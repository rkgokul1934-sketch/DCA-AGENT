"""
One-time script: creates the event_templates table and seeds default records.
Run from project root: python seed_event_templates.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "sqlite+aiosqlite:///./booking.db"

async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)

    # Create table
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS event_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                duration INTEGER DEFAULT 30,
                provider VARCHAR(50) DEFAULT 'open',
                meeting_type VARCHAR(100) DEFAULT 'one-on-one',
                availability VARCHAR(255) DEFAULT 'Weekdays (9am-5pm)',
                color VARCHAR(20) DEFAULT '#6366f1',
                active BOOLEAN DEFAULT 1,
                description TEXT,
                approval_type VARCHAR(50) DEFAULT 'auto',
                questions JSON,
                bookings_count INTEGER DEFAULT 0,
                revenue_attributed VARCHAR(50) DEFAULT '$0',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("✅ event_templates table created (or already existed)")

    # Seed defaults
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        # Check if already seeded
        result = await session.execute(text("SELECT COUNT(*) FROM event_templates"))
        count = result.scalar()
        if count and count > 0:
            print(f"ℹ️  Already seeded with {count} records — skipping.")
            return

        seeds = [
            {
                "title": "Product Demo Call",
                "slug": "demo",
                "duration": 30,
                "provider": "google",
                "meeting_type": "one-on-one",
                "availability": "Weekdays (9am-5pm)",
                "color": "#6366f1",
                "active": 1,
                "description": "Deep dive overview of RevOps orchestration and database automation.",
                "approval_type": "auto",
                "questions": '["Company size?", "CRM in use?"]',
                "bookings_count": 42,
                "revenue_attributed": "$126,000",
            },
            {
                "title": "Executive Strategy Session",
                "slug": "strategy",
                "duration": 45,
                "provider": "zoom",
                "meeting_type": "round robin",
                "availability": "Mon, Wed, Fri (10am-4pm)",
                "color": "#8b5cf6",
                "active": 1,
                "description": "Bespoke alignment session covering BANT qualification parameters.",
                "approval_type": "manual",
                "questions": '["Expected deal value?", "Decision maker involved?"]',
                "bookings_count": 28,
                "revenue_attributed": "$180,000",
            },
            {
                "title": "Technical Integration Review",
                "slug": "deepdive",
                "duration": 60,
                "provider": "teams",
                "meeting_type": "collective",
                "availability": "Weekdays (9am-5pm)",
                "color": "#10b981",
                "active": 0,
                "description": "OAuth integrations, webhooks, and enterprise security review.",
                "approval_type": "manager",
                "questions": '["Cloud provider?", "Security compliance required?"]',
                "bookings_count": 15,
                "revenue_attributed": "$45,000",
            },
            {
                "title": "Discovery & Qualification",
                "slug": "discovery",
                "duration": 15,
                "provider": "open",
                "meeting_type": "discovery call",
                "availability": "Anytime (24/7 Auto)",
                "color": "#f59e0b",
                "active": 1,
                "description": "Short check-in to verify lead segment and pipeline requirements.",
                "approval_type": "auto",
                "questions": '["Timeline for implementation?"]',
                "bookings_count": 89,
                "revenue_attributed": "$310,000",
            },
        ]

        for s in seeds:
            await session.execute(text("""
                INSERT INTO event_templates
                    (title, slug, duration, provider, meeting_type, availability,
                     color, active, description, approval_type, questions,
                     bookings_count, revenue_attributed)
                VALUES
                    (:title, :slug, :duration, :provider, :meeting_type, :availability,
                     :color, :active, :description, :approval_type, :questions,
                     :bookings_count, :revenue_attributed)
            """), s)

        await session.commit()
        print(f"✅ Seeded {len(seeds)} default event templates.")

    await engine.dispose()
    print("Done.")

asyncio.run(main())
