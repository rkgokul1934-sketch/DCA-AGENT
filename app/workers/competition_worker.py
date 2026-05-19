from app.celery_app import celery_app
from app.services.research_service import research_service
from app.services.crawler_service import crawler_service
from app.services.llm_analysis_service import llm_analysis_service
from app.services.scoring_service import scoring_service
from app.services.cache_service import cache_service
import asyncio
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

async def process_company(company_name: str, provided_url: Optional[str] = None):
    """
    Full pipeline for a single company: Discover -> Crawl (Parallel) -> Analyze -> Score
    """
    logger.info(f"Starting pipeline for {company_name}")
    
    # 1. Discovery (Prioritizes provided URL)
    assets = await research_service.discover_company_assets(company_name, provided_url)
    
    # 2. Parallel Crawling
    logger.info(f"Crawling assets in parallel for {company_name}")
    crawl_tasks = [crawler_service.crawl_url(url, company_name) for url in assets.values()]
    crawled_results = await asyncio.gather(*crawl_tasks)
    crawled_texts = [text for text in crawled_results if text]
            
    # 3. AI Analysis
    logger.info(f"Analyzing data for {company_name}")
    extracted_data = await llm_analysis_service.analyze_company_data(company_name, crawled_texts)
    
    # 4. Scoring
    scores = scoring_service.calculate_scores(extracted_data)
    
    return {
        "name": company_name,
        "assets": assets,
        "details": extracted_data,
        "scores": scores
    }

async def run_analysis_pipeline(
    our_company: str, 
    competitor: str, 
    our_url: Optional[str] = None, 
    comp_url: Optional[str] = None
):
    cache_key = f"{our_company}_vs_{competitor}"
    
    # Process both companies in parallel
    logger.info(f"Starting dual-research for {our_company} and {competitor}")
    our_task = process_company(our_company, our_url)
    comp_task = process_company(competitor, comp_url)
    
    our_results, comp_results = await asyncio.gather(our_task, comp_task)
    
    # Deep Comparative Analysis via LLM
    logger.info("Generating comparative intelligence report")
    comparison = await llm_analysis_service.compare_companies(
        our_results["details"], 
        comp_results["details"]
    )
    
    # Construct final intelligence report
    report = {
        "analysis_id": datetime.utcnow().strftime("%Y%m%d%H%M%S"),
        "our_company": {
            "name": our_company,
            "url": our_results["assets"].get("official_website"),
            "details": our_results["details"],
            "scores": our_results["scores"]
        },
        "competitor": {
            "name": competitor,
            "url": comp_results["assets"].get("official_website"),
            "details": comp_results["details"],
            "scores": comp_results["scores"]
        },
        "comparison": comparison,
        "overall_summary": comp_results["details"].get("market_positioning", ""),
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Cache result
    await cache_service.set(cache_key, report)
    return report

@celery_app.task(name="analyze_competition_task")
def analyze_competition_task(our_company: str, competitor: str, our_url: Optional[str] = None, comp_url: Optional[str] = None):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(run_analysis_pipeline(our_company, competitor, our_url, comp_url))
