# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from app.database import get_db
from app.models.availability import AvailabilitySetting
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

router = APIRouter(prefix="/availability", tags=["Availability Settings"])

class SettingUpdateRequest(BaseModel):
    value: dict

@router.get("/{key}")
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    query = select(AvailabilitySetting).where(AvailabilitySetting.key == key)
    result = await db.execute(query)
    setting = result.scalar_one_or_none()
    if not setting:
        return {"value": {}}
    return {"value": setting.value}

@router.post("/{key}")
async def update_setting(key: str, request: SettingUpdateRequest, db: AsyncSession = Depends(get_db)):
    query = select(AvailabilitySetting).where(AvailabilitySetting.key == key)
    result = await db.execute(query)
    setting = result.scalar_one_or_none()
    
    if not setting:
        setting = AvailabilitySetting(key=key, value=request.value)
        db.add(setting)
    else:
        setting.value = request.value
        
    await db.commit()
    return {"status": "success", "key": key, "value": setting.value}
