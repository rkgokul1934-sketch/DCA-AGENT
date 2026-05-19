from app.agent.tools import agent_tools
from app.agent.memory import agent_memory
from app.services.llm_analysis_service import llm_analysis_service
from app.services.session_service import session_service
from app.services.qualification_service import qualification_service
from app.config import settings
from app.repositories.booking import booking_repo
from sqlalchemy import select
from app.models.sales_rep import MeetingType
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import json
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Optimized Reasoning Engine.
    Uses AI-powered intent detection to avoid keyword confusion.
    """
    
    async def run_goal(self, goal: str, db: AsyncSession, session_id: str = None):
        logger.info(f"Agent Goal Received: {goal} | Session: {session_id}")
        
        # 0. Handle Session Context
        if not session_id:
            session_id = str(uuid.uuid4())
            
        session = await session_service.get_or_create_session(session_id, db)
        
        # 1. AI-Powered Intent Detection
        intent = await self._classify_intent(goal)
        logger.info(f"Detected Intent: {intent}")
        
        # 2. Strategic Routing (Intent-First)
        if intent == "lookup" or "list" in goal.lower() or "my booking" in goal.lower():
            return await self._execute_lookup_flow(goal, session, db)
            
        if intent == "reschedule" or "move" in goal.lower() or "change" in goal.lower():
            return await self._execute_reschedule_flow(goal, session, db)

        # 3. Fallback to Step-based flow
        if session.current_step.startswith("discovery"):
            return await self._execute_discovery_flow(goal, session, db)
            
        if session.current_step.startswith("lookup"):
            return await self._execute_lookup_flow(goal, session, db)
        
        if session.current_step.startswith("reschedule"):
            return await self._execute_reschedule_flow(goal, session, db)

        if intent == "booking":
            return await self._execute_discovery_flow(goal, session, db)
        else:
            return await self._execute_comparison_flow(goal)

    async def _classify_intent(self, goal: str) -> str:
        prompt = f"Classify intent for: '{goal}'. Options: booking (new meeting), reschedule (change existing), lookup (check status/list bookings), comparison (competitor research). Return word only."
        try:
            response = await llm_analysis_service.client.chat.completions.create(
                model=settings.BEDROCK_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            text = response.choices[0].message.content.lower()
            if "yes" in goal.lower() or "schedule" in goal.lower() or "book" in goal.lower(): 
                return "booking"
            if "reschedule" in text: return "reschedule"
            if "lookup" in text or "list" in text: return "lookup"
            if "booking" in text or "schedule" in text: return "booking"
            return "comparison"
        except Exception: return "comparison"

    async def _execute_discovery_flow(self, goal: str, session, db: AsyncSession):
        # 1. NEW: Dedicated Menu Step
        if session.current_step == "discovery_init" and not session.collected_answers:
            mt_query = select(MeetingType)
            result = await db.execute(mt_query)
            meeting_types = result.scalars().all()
            
            types_list = "\n".join([f"• {mt.name} ({mt.duration_minutes} min)" for mt in meeting_types])
            
            # Transition to a specialized 'menu_active' sub-step
            await session_service.update_session(session.session_id, "discovery_menu", {"_menu_shown": True}, db)
            
            return {
                "agent_thought": "Showing Demo Menu",
                "answer": {"message": f"I'd be happy to help you find the right scheduling solution! We offer several specialized demo sessions depending on your needs:\n\n{types_list}\n\nWhich one would you like to explore today?"},
                "status": "incomplete",
                "session_id": session.session_id
            }

        # 2. Define the Question Flow
        steps = {
            "discovery_menu": {
                "question": "Perfect! To get started with that session, could you please provide your full name and work email?",
                "next": "discovery_company"
            },
            "discovery_company": {
                "question": "Got it. What is your company name and approximately how many employees do you have?",
                "next": "discovery_role"
            },
            "discovery_role": {
                "question": "Thanks! What is your role and what is the primary use case you are looking to solve?",
                "next": "discovery_completed"
            }
        }
        
        current_step = session.current_step
        if current_step == "discovery_completed":
            return {"agent_thought": "Done", "answer": {"message": "You're all set! Pick a slot below."}, "status": "completed"}

        # 3. Proactive Extraction
        extracted_data = await self._extract_discovery_data(goal, current_step)
        next_step = steps.get(current_step, {"next": "discovery_completed"})["next"]
        await session_service.update_session(session.session_id, next_step, extracted_data, db)
        
        # 3.1 SMART SKIP (Except for identity/menu transition)
        while next_step in steps:
            # We don't skip the identity capture unless we have both name and email
            if next_step == "discovery_menu" and session.collected_answers.get("name") and session.collected_answers.get("email"):
                next_step = steps[next_step]["next"]
                continue
            if next_step == "discovery_company" and session.collected_answers.get("company_name"):
                next_step = steps[next_step]["next"]
                continue
            if next_step == "discovery_role" and session.collected_answers.get("role"):
                next_step = steps[next_step]["next"]
                continue
            break
            
        await session_service.update_session(session.session_id, next_step, {}, db)

        # 4. Handle Completion
        if next_step == "discovery_completed":
            score_result = await qualification_service.score_lead(session.collected_answers)
            await session_service.complete_session(session.session_id, db)
            
            is_vip = score_result["classification"] == "vip"
            
            # Log to AuditLog for GTM Compliance
            try:
                from app.models.audit import AuditLog
                audit = AuditLog(
                    event_type="lead_qualified",
                    entity_type="lead",
                    entity_id=0,
                    actor="agent",
                    action_details=f"AI Agent qualified lead: {session.collected_answers.get('name')} from {session.collected_answers.get('company_name')} scored {score_result['score']}% (ICP Grade: {score_result['classification'].upper()})",
                    metadata_json={"score": score_result["score"], "classification": score_result["classification"]}
                )
                db.add(audit)
                await db.commit()
            except Exception as e:
                print(f"Failed to log lead qualification audit: {e}")
                
            return {
                "agent_thought": f"Lead Scored: {score_result['score']}",
                "answer": {
                    "message": "Based on your needs, you've been prioritized for an enterprise strategy session! Please pick a slot." if is_vip else "Great! You're all set. Please pick a slot.",
                    "lead_score": score_result["score"],
                    "lead_data": {
                        "name": session.collected_answers.get("name"),
                        "email": session.collected_answers.get("email"),
                        "company_name": session.collected_answers.get("company_name"),
                        "role": session.collected_answers.get("role")
                    },
                    "recommendation": "direct_booking_vip" if is_vip else "direct_booking"
                },
                "status": "completed"
            }

        return {
            "agent_thought": f"Moving to {next_step}",
            "answer": {
                "message": steps.get(next_step, steps["discovery_menu"])["question"],
                "lead_data": {
                    "name": session.collected_answers.get("name"),
                    "email": session.collected_answers.get("email"),
                    "company_name": session.collected_answers.get("company_name"),
                    "role": session.collected_answers.get("role")
                }
            },
            "status": "incomplete",
            "session_id": session.session_id
        }

    async def _execute_lookup_flow(self, goal: str, session, db: AsyncSession):
        if session.current_step != "lookup_active":
            await session_service.update_session(session.session_id, "lookup_active", {}, db)
            return {
                "agent_thought": "Initiating lookup flow",
                "answer": {"message": "I'd be happy to check your bookings. Could you please provide your full name and the email address used for the booking?"},
                "status": "incomplete",
                "session_id": session.session_id
            }
        
        extracted = await self._extract_discovery_data(goal, "discovery_init")
        name = extracted.get("name")
        email = extracted.get("email")
        
        if not name or not email:
            return {
                "agent_thought": "Details missing for lookup",
                "answer": {"message": "I missed that. Could you please clearly state your name and email?"},
                "status": "incomplete",
                "session_id": session.session_id
            }

        booking = await booking_repo.get_by_name_and_email(db, name, email)
        await session_service.update_session(session.session_id, "discovery_init", extracted, db)

        if not booking:
            return {
                "agent_thought": "No booking found, offering new booking",
                "answer": {
                    "message": f"I couldn't find any active bookings for {name} ({email}). Would you like to schedule a new one right now?",
                    "lead_data": {
                        "name": name,
                        "email": email,
                        "company_name": extracted.get("company_name"),
                        "role": extracted.get("role")
                    }
                },
                "status": "completed"
            }

        return {
            "agent_thought": f"Found booking for {email}",
            "answer": {
                "message": f"Found it! You have a booking for '{booking.meeting_title}' on {booking.booking_date} at {booking.booking_time} ({booking.timezone}). Status: {booking.status.upper()}."
            },
            "status": "completed"
        }

    async def _execute_reschedule_flow(self, goal: str, session, db: AsyncSession):
        if session.current_step != "reschedule_active":
            await session_service.update_session(session.session_id, "reschedule_active", {}, db)
            return {
                "agent_thought": "Initiating reschedule flow",
                "answer": {"message": "I can help with that. First, can you confirm your name and email to find your booking?"},
                "status": "incomplete",
                "session_id": session.session_id
            }

        if "collected_answers" in session.__dict__ and session.collected_answers.get("email"):
            extracted = await self._extract_reschedule_data(goal)
            new_date = extracted.get("date")
            new_time = extracted.get("time")

            if not new_date or not new_time:
                return {
                    "agent_thought": "Awaiting new date/time",
                    "answer": {"message": "Got your details! When would you like to move the demo to? (Please provide date and time)"},
                    "status": "incomplete",
                    "session_id": session.session_id
                }
            
            email = session.collected_answers.get("email")
            name = session.collected_answers.get("name")
            booking = await booking_repo.get_by_name_and_email(db, name, email)
            
            if booking:
                booking.booking_date = datetime.strptime(new_date, '%Y-%m-%d').date() if '-' in new_date else booking.booking_date
                booking.booking_time = datetime.strptime(new_time, '%H:%M:%S').time() if ':' in new_time else booking.booking_time
                booking.status = "rescheduled"
                await db.commit()
                
                await session_service.update_session(session.session_id, "discovery_init", {}, db)
                return {
                    "agent_thought": "Reschedule complete",
                    "answer": {"message": f"Success! Your demo has been moved to {new_date} at {new_time}. You will receive an updated calendar invite shortly."},
                    "status": "completed"
                }
        else:
            extracted = await self._extract_discovery_data(goal, "discovery_init")
            if extracted.get("name") and extracted.get("email"):
                await session_service.update_session(session.session_id, "reschedule_active", extracted, db)
                return {
                    "agent_thought": "Found user, asking for date",
                    "answer": {"message": f"I found your booking for {extracted['name']}. When would you like to move it to?"},
                    "status": "incomplete",
                    "session_id": session.session_id
                }
        
        return {
            "agent_thought": "Awaiting details",
            "answer": {"message": "Please provide your name and email so I can locate your booking."},
            "status": "incomplete",
            "session_id": session.session_id
        }

    async def _extract_reschedule_data(self, goal: str) -> dict:
        prompt = f"Extract 'date' (YYYY-MM-DD) and 'time' (HH:MM:SS) from: '{goal}'. Return JSON."
        try:
            response = await llm_analysis_service.client.chat.completions.create(
                model=settings.BEDROCK_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception: return {}

    async def _extract_discovery_data(self, goal: str, step: str) -> dict:
        prompt = f"Extract all possible lead info from: '{goal}'. Fields: name, email, company_name, company_size, role, use_case. Return JSON with all fields (null if missing)."
        try:
            response = await llm_analysis_service.client.chat.completions.create(
                model=settings.BEDROCK_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            return {k: v for k, v in data.items() if v is not None}
        except Exception: return {}

    async def _execute_comparison_flow(self, goal: str):
        return {"agent_thought": "Comparing...", "answer": {"message": "Analyzing market intelligence..."}, "status": "completed"}

agent_orchestrator = AgentOrchestrator()
