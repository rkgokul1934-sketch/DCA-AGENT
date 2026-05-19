from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.sales_rep import SalesRep
from app.models.booking import Booking
from app.models.audit import AuditLog
from app.models.lead import LeadProfile, LeadScore
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/enterprise", tags=["Enterprise Demo"])

@router.get("/rep/workload")
async def get_rep_workload(db: AsyncSession = Depends(get_db)):
    """
    Returns sales team utilization and performance for the dashboard.
    """
    query = select(SalesRep)
    result = await db.execute(query)
    reps = result.scalars().all()
    
    workload = []
    for rep in reps:
        # Mocking some metrics for the demo
        workload.append({
            "name": rep.name,
            "assigned_leads": random.randint(5, 20),
            "meetings_today": random.randint(1, 5),
            "open_slots": 8,
            "conversion_rate": 25.5,
            "utilization": random.randint(40, 95),
            "status": "Available" if random.random() > 0.3 else "Busy"
        })
    return workload

@router.get("/lead/profile/{id}")
async def get_lead_profile(id: int, db: AsyncSession = Depends(get_db)):
    """
    Returns the deep prospect dossier.
    """
    # Simple mock for demo dossier
    return {
        "id": id,
        "name": "Sarah Jenkins",
        "company": "Acme Corp",
        "designation": "Director of Sales",
        "icp_score": 92,
        "intent_score": 85,
        "region": "North America",
        "qualification_notes": "Very interested in automated scheduling. Budget confirmed.",
        "next_action": "Send strategy review document"
    }

@router.get("/ai/explain")
async def ai_explain(decision_id: str = "latest"):
    """
    Provides the rationale for the latest AI decision.
    """
    return {
        "rationale": "Lead identified as high-intent due to specific mention of 'scaling efficiency'. ICP match confirmed via company size (500+) and industry (SaaS).",
        "confidence": 0.94,
        "logic_trace": ["Entity Extraction", "Semantic Match", "Strategic Scoring"]
    }

@router.get("/trends/history")
async def get_trends():
    """
    Returns 7-day performance trends for animated charts.
    """
    return [
        {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), "leads": random.randint(10, 50), "bookings": random.randint(2, 10)}
        for i in range(7)
    ]

from pydantic import BaseModel

class SimulationRequest(BaseModel):
    scenario: str

@router.post("/simulation/run")
async def run_simulation(request: SimulationRequest, db: AsyncSession = Depends(get_db)):
    """
    Triggers an orchestrated showcase scenario.
    """
    scenario = request.scenario
    # Create an audit log entry for the simulation
    log = AuditLog(
        event_type="simulation",
        entity_type="system",
        entity_id=0,
        actor="Admin",
        action_details=f"Triggered Scenario: {scenario}",
        metadata_json={"scenario": scenario}
    )
    db.add(log)
    await db.commit()
    return {"status": "triggered", "scenario": scenario}

@router.get("/system/recovery")
async def system_recovery():
    """
    Simulates a failure recovery event.
    """
    return {
        "event": "CRM Sync Timeout",
        "status": "Recovered",
        "action": "Retried and synchronized via fallback gateway",
        "timestamp": datetime.now().isoformat()
    }
