# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any

class CompetitorBase(BaseModel):
    competitor_name: str
    pricing: Dict[str, Any]
    features: List[str]
    ai_capabilities: Dict[str, Any]
    integrations: List[str]
    pros: List[str]
    cons: List[str]
    score: float

class CompetitorCreate(CompetitorBase):
    pass

class Competitor(CompetitorBase):
    id: int
    created_at: datetime


    class Config:
        from_attributes = True

from typing import List, Dict, Any, Optional

class CompetitionAnalysisRequest(BaseModel):
    our_company: str
    our_company_url: Optional[str] = None
    competitor: str
    competitor_url: Optional[str] = None

class CompetitionAnalysisResponse(BaseModel):
    our_company: str
    competitor: str
    pricing_comparison: Dict[str, Any]
    feature_comparison: Dict[str, Any]
    ai_capabilities: Dict[str, Any]
    overall_score: float
    summary: str
