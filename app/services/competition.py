from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.competitor import competitor_repo
from app.schemas.competitor import CompetitionAnalysisRequest, CompetitionAnalysisResponse
from fastapi import HTTPException

class CompetitionService:
    async def analyze_competition(
        self, db: AsyncSession, request: CompetitionAnalysisRequest
    ) -> CompetitionAnalysisResponse:
        competitor = await competitor_repo.get_by_name(db, name=request.competitor)
        if not competitor:
            raise HTTPException(status_code=404, detail=f"Competitor '{request.competitor}' not found in database")
        
        # Placeholder for future LLM integration
        # For now, return static data from the DB comparison
        
        return CompetitionAnalysisResponse(
            our_company=request.our_company,
            competitor=competitor.competitor_name,
            pricing_comparison={
                "our_pricing": "Contact Sales",
                "competitor_pricing": competitor.pricing
            },
            feature_comparison={
                "our_features": ["Advanced AI", "Seamless Integration"],
                "competitor_features": competitor.features
            },
            ai_capabilities=competitor.ai_capabilities,
            overall_score=competitor.score,
            summary=f"Analysis of {request.our_company} vs {competitor.competitor_name}. {competitor.competitor_name} has strong {competitor.features[0] if competitor.features else 'features'}."
        )

competition_service = CompetitionService()
