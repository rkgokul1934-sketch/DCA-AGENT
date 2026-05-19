# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.competitor import CompetitionAnalysisRequest
from app.services.cache_service import cache_service
from app.workers.competition_worker import analyze_competition_task
from app.workers.competition_worker import run_analysis_pipeline

router = APIRouter()

@router.post("/competition-analysis")
async def start_competition_analysis(
    request: CompetitionAnalysisRequest,
    sync: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Starts an asynchronous competition analysis.
    Checks cache first, otherwise triggers a background job.
    Supports optional company URLs for more accurate discovery.
    """
    cache_key = f"{request.our_company}_vs_{request.competitor}"
    cached_result = await cache_service.get(cache_key)
    
    if cached_result:
        return {
            "status": "completed",
            "message": "Result found in cache",
            "data": cached_result
        }
    
    if sync:
        result = await run_analysis_pipeline(
            request.our_company, 
            request.competitor, 
            request.our_company_url, 
            request.competitor_url
        )
        return {
            "status": "completed",
            "message": "Analysis finished synchronously",
            "data": result
        }

    # Trigger background task
    try:
        task = analyze_competition_task.delay(
            request.our_company, 
            request.competitor,
            request.our_company_url,
            request.competitor_url
        )
        return {
            "status": "pending",
            "message": "Analysis started in background",
            "task_id": task.id
        }
    except Exception:
        # Fallback to sync if Celery fails
        result = await run_analysis_pipeline(
            request.our_company, 
            request.competitor,
            request.our_company_url,
            request.competitor_url
        )
        return {
            "status": "completed",
            "message": "Analysis finished (fallback to sync)",
            "data": result
        }

# @router.get("/competition-analysis/{task_id}")
# async def get_analysis_status(task_id: str):
#     """
#     Get results of a background AI analysis using the Task ID.
#     """
#     # pyrefly: ignore [missing-import]
#     from celery.result import AsyncResult
#     from app.celery_app import celery_app
    
#     # Query Redis backend for the task state
#     result = AsyncResult(task_id, app=celery_app)
    
#     if result.ready():
#         # Task is finished, return the final AI report
#         return {
#             "status": "completed",
#             "result": result.result
#         }
    
#     # Task is still in progress (Pending, Started, or Retrying)
#     return {
#         "status": result.status,
#         "message": "Task is still processing"
#     }
