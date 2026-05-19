import asyncio
from app.database import SessionLocal, Base, engine
from app.models.sales_rep import SalesRep, MeetingType
from app.models.audit import AuditLog
from app.models.booking import Booking
from datetime import date, time, datetime

async def seed_enterprise_data():
    async with engine.begin() as conn:
        # Don't drop all for now to keep existing users, just ensure tables exist
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # 1. Seed Sales Rep
        from sqlalchemy import select
        res = await db.execute(select(SalesRep).where(SalesRep.email == "demo-rep@dca.ai"))
        if not res.scalar_one_or_none():
            rep = SalesRep(
                name="Enterprise Demo Rep",
                email="demo-rep@dca.ai",
                timezone="UTC",
                working_hours={"mon": ["00:00", "23:59"], "tue": ["00:00", "23:59"], "wed": ["00:00", "23:59"], "thu": ["00:00", "23:59"], "fri": ["00:00", "23:59"]},
                is_active=True
            )
            db.add(rep)

        # 2. Seed Meeting Types
        types = [
            {
                "name": "Product Demo",
                "slug": "demo",
                "duration_minutes": 30,
                "buffer_minutes": 10,
                "description": "A standard walkthrough of the DCA platform."
            },
            {
                "name": "Executive Strategy",
                "slug": "exec-strategy",
                "duration_minutes": 45,
                "buffer_minutes": 15,
                "description": "High-level ROI and strategic alignment session."
            },
            {
                "name": "Technical Deep Dive",
                "slug": "tech-dive",
                "duration_minutes": 60,
                "buffer_minutes": 30,
                "description": "Architecture, security, and integration review."
            }
        ]

        for t_data in types:
            res = await db.execute(select(MeetingType).where(MeetingType.slug == t_data["slug"]))
            if not res.scalar_one_or_none():
                mt = MeetingType(**t_data)
                db.add(mt)

        # 3. Seed Initial Audit Logs
        logs = [
            AuditLog(
                event_type="system",
                entity_type="server",
                entity_id=0,
                actor="System Engine",
                action_details="DCA RevOps Platform v1.0 Initialized successfully.",
                metadata_json={"version": "1.0", "status": "green"}
            ),
            AuditLog(
                event_type="optimization",
                entity_type="sales_rep",
                entity_id=1,
                actor="AI Orchestrator",
                action_details="Sales Rep workload re-balanced across North America territory.",
                metadata_json={"rep_id": 1, "action": "rebalance"}
            ),
            AuditLog(
                event_type="compliance",
                entity_type="data",
                entity_id=0,
                actor="Security Monitor",
                action_details="End-to-end encryption verified for calendar synchronization.",
                metadata_json={"protocol": "TLS 1.3"}
            )
        ]
        db.add_all(logs)

        try:
            await db.commit()
            print("✅ Enterprise Demo Data seeded successfully!")
        except Exception as e:
            await db.rollback()
            print(f"❌ Seeding Error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_enterprise_data())
