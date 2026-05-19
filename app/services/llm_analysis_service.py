# pyrefly: ignore [missing-import]
from openai import AsyncOpenAI
from app.config import settings
import json
import logging

logger = logging.getLogger(__name__)

class LLMAnalysisService:
    def __init__(self):
        # Configure client for AWS Bedrock / Mantle API
        # The base_url should point to the /v1 part of the URL
        base_url = settings.BEDROCK_API_URL.replace("/chat/completions", "")
        self.client = AsyncOpenAI(
            api_key=settings.BEDROCK_API_KEY,
            base_url=base_url
        )
        self.model = settings.BEDROCK_MODEL

    async def analyze_company_data(self, company_name: str, crawled_texts: list) -> dict:
        """
        Uses AWS Bedrock to analyze crawled text and extract structured JSON data.
        """
        combined_text = "\n".join(crawled_texts)[:15000] # Limit context window
        if not combined_text.strip():
            return {}
            
        prompt = f"""
        Analyze the following text content from {company_name}'s digital assets.
        Extract detailed information into a STRICT JSON format.
        
        REQUIRED FIELDS:
        - pricing: list of plans with features and estimated cost
        - features: list of key product features
        - ai_capabilities: detailed list of AI-powered features
        - integrations: list of supported software integrations
        - pros: list of market strengths
        - cons: list of weaknesses
        - enterprise_readiness_score: (1-10)
        - market_positioning: short summary
        
        TEXT CONTENT:
        {combined_text}
        
        RESPONSE FORMAT:
        {{
            "pricing": {{ "plans": [], "transparency_score": 0 }},
            "features": [],
            "ai_capabilities": {{ "tools": [], "sophistication_score": 0 }},
            "integrations": [],
            "pros": [],
            "cons": [],
            "market_positioning": "",
            "enterprise_readiness_score": 0
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": "You are a senior market research analyst."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error in Bedrock analysis for {company_name}: {e}")
            return {}

    async def compare_companies(self, our_data: dict, competitor_data: dict) -> dict:
        """
        Uses AWS Bedrock to compare two companies and identify key differences.
        """
        prompt = f"""
        Compare the following two companies based on their extracted data.
        
        OUR COMPANY DATA:
        {json.dumps(our_data, indent=2)}
        
        COMPETITOR DATA:
        {json.dumps(competitor_data, indent=2)}
        
        Provide a strategic comparison in STRICT JSON format.
        REQUIRED FIELDS:
        - key_differences: list of major differences
        - our_advantages: why customers should choose us over them
        - their_advantages: why customers might choose them over us
        - market_gap: identified opportunities
        - recommendations: strategic steps for us
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": "You are a senior competitive intelligence analyst."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error in Bedrock comparison: {e}")
            return {}

llm_analysis_service = LLMAnalysisService()
