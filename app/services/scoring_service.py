from typing import Dict, Any

class ScoringService:
    def calculate_scores(self, company_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculates deterministic scores based on extracted data features.
        Weights:
        - 0.15 * pricing
        - 0.25 * features
        - 0.25 * ai
        - 0.10 * integrations
        - 0.10 * market
        - 0.10 * reviews (placeholder for now)
        - 0.05 * enterprise
        """
        
        # Pricing Score (Transparency + Plan count)
        pricing_data = company_data.get("pricing", {})
        pricing_score = (pricing_data.get("transparency_score", 0) * 0.7) + (min(len(pricing_data.get("plans", [])), 5) * 0.6)
        pricing_score = min(pricing_score, 10.0)

        # Features Score
        features = company_data.get("features", [])
        feature_score = min(len(features) * 0.8, 10.0)

        # AI Score
        ai_data = company_data.get("ai_capabilities", {})
        ai_score = ai_data.get("sophistication_score", 0)

        # Integrations Score
        integrations = company_data.get("integrations", [])
        integration_score = min(len(integrations) * 0.5, 10.0)

        # Enterprise Score
        enterprise_score = company_data.get("enterprise_readiness_score", 0)

        # Market Score (based on pros/cons count)
        pros = company_data.get("pros", [])
        cons = company_data.get("cons", [])
        market_score = min((len(pros) - len(cons)) + 5, 10.0)

        # Reviews (Mocked for now as 7.5 if data exists)
        reviews_score = 7.5

        # Weighted calculation
        final_score = (
            (0.15 * pricing_score) +
            (0.25 * feature_score) +
            (0.25 * ai_score) +
            (0.10 * integration_score) +
            (0.10 * market_score) +
            (0.10 * reviews_score) +
            (0.05 * enterprise_score)
        )

        return {
            "pricing": round(pricing_score, 2),
            "features": round(feature_score, 2),
            "ai": round(ai_score, 2),
            "integrations": round(integration_score, 2),
            "market": round(market_score, 2),
            "reviews": round(reviews_score, 2),
            "enterprise": round(enterprise_score, 2),
            "overall_score": round(final_score, 2)
        }

scoring_service = ScoringService()
