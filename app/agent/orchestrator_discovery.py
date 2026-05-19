    async def _execute_discovery_flow(self, goal: str, session, db: AsyncSession):
        # 1. Check if we should show the Demo Menu (First interaction)
        if session.current_step == "discovery_init" and not session.collected_answers:
            mt_query = select(MeetingType)
            result = await db.execute(mt_query)
            meeting_types = result.scalars().all()
            
            types_list = "\n".join([f"• {mt.name} ({mt.duration_minutes} min)" for mt in meeting_types])
            
            # Mark as initialized so we move to next step on next message
            await session_service.update_session(session.session_id, "discovery_init", {"_init": True}, db)
            
            return {
                "agent_thought": "Listing meeting types",
                "answer": {"message": f"I'd be happy to help you find the right scheduling solution! We offer several specialized demo sessions depending on your needs:\n\n{types_list}\n\nWhich one would you like to explore today?"},
                "status": "incomplete",
                "session_id": session.session_id
            }

        # 2. Define the Question Flow
        steps = {
            "discovery_init": {
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

        # 3. Extract data from current message and move to next step
        extracted_data = await self._extract_discovery_data(goal, current_step)
        next_step = steps[current_step]["next"]
        await session_service.update_session(session.session_id, next_step, extracted_data, db)
        
        # 4. Handle Completion
        if next_step == "discovery_completed":
            score_result = await qualification_service.score_lead(session.collected_answers)
            await session_service.complete_session(session.session_id, db)
            
            is_vip = score_result["classification"] == "vip"
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
            "answer": {"message": steps[next_step]["question"]},
            "status": "incomplete",
            "session_id": session.session_id
        }
