from app.services.llm_analysis_service import llm_analysis_service
import json
import logging

logger = logging.getLogger(__name__)

class QualificationService:
    """
    Uses AI to score leads based on company size, role, use case, and budget.
    """
    
    async def score_lead(self, lead_data: dict) -> dict:
        """
        Calls Bedrock to analyze lead quality and provide a routing decision.
        """
        prompt = f"""
        Analyze the following lead data for a B2B SaaS demo booking.
        Assign a score from 0-100 based on the probability of conversion and potential deal size.
        
        LEAD DATA:
        {json.dumps(lead_data, indent=2)}
        
        CRITERIA:
        - High Score (>80): Enterprise role, clear use case, large company.
        - Medium Score (40-80): Mid-market role, standard use case.
        - Low Score (<40): Student, generic role, or tiny company.
        
        RESPONSE FORMAT (STRICT JSON):
        {{
            "score": 0,
            "classification": "vip/standard/nurture",
            "reasoning": "Explain why this score was given.",
            "suggested_routing": "direct_booking/nurture_flow"
        }}
        """
        
        try:
            response = await llm_analysis_service.client.chat.completions.create(
                model=llm_analysis_service.model,
                messages=[{"role": "system", "content": "You are a senior Sales Development Representative (SDR)."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error in lead scoring: {e}")
            # Fallback to standard
            return {
                "score": 50,
                "classification": "standard",
                "reasoning": "Fallback due to AI error.",
                "suggested_routing": "direct_booking"
            }

qualification_service = QualificationService()
