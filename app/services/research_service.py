# pyrefly: ignore [missing-import]
from serpapi import GoogleSearch
from app.config import settings
from typing import Dict, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        self.api_key = settings.SERPAPI_API_KEY

    async def discover_company_assets(self, company_name: str, provided_url: Optional[str] = None) -> Dict[str, str]:
        """
        Discovers key pages using Google Search.
        If a provided_url is given, it uses it as the base and searches for related pages.
        """
        assets = {}
        
        # Use provided URL as official website if available
        if provided_url:
            assets["official_website"] = provided_url
            logger.info(f"Using provided URL for {company_name}: {provided_url}")
            
            # Restrict searches to the provided domain for better accuracy
            domain = provided_url.split("//")[-1].split("/")[0]
            search_queries = {
                "pricing_page": f"site:{domain} pricing plans",
                "ai_capabilities": f"site:{domain} AI features machine learning",
                "features_page": f"site:{domain} features products"
            }
        else:
            search_queries = {
                "official_website": f"{company_name} official website",
                "pricing_page": f"{company_name} pricing plans",
                "ai_capabilities": f"{company_name} AI features and machine learning"
            }
        
        for key, query in search_queries.items():
            if key in assets: continue # Skip if already set
            try:
                result = await asyncio.to_thread(self._run_search, query)
                if result:
                    assets[key] = result
                    logger.info(f"Discovered {key} for {company_name}: {result}")
            except Exception as e:
                logger.error(f"Search failed for {query}: {e}")
        
        return assets

    def _run_search(self, query: str) -> str | None:
        search = GoogleSearch({
            "q": query,
            "api_key": self.api_key,
            "num": 1
        })
        result = search.get_dict()
        if "organic_results" in result and len(result["organic_results"]) > 0:
            return result["organic_results"][0]["link"]
        return None

research_service = ResearchService()
