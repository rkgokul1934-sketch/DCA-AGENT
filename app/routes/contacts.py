from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, delete, func
from app.database import get_db
from app.models.contact import Contact as ContactModel
from app.schemas.contact import Contact as ContactSchema, ContactCreate, ContactUpdate
from typing import List, Optional
from datetime import datetime

router = APIRouter()

@router.get("/widgets")
async def get_widgets(db: AsyncSession = Depends(get_db)):
    # Run counts and scores in DB
    total_result = await db.execute(select(func.count(ContactModel.id)))
    total_contacts = total_result.scalar() or 0

    active_result = await db.execute(
        select(func.count(ContactModel.id)).where(ContactModel.pipeline_stage.in_(["Discovery", "Qualification", "Proposal"]))
    )
    active_leads = active_result.scalar() or 0

    booked_result = await db.execute(
        select(func.count(ContactModel.id)).where(ContactModel.next_meeting.is_not(None))
    )
    booked_this_week = booked_result.scalar() or 0

    stale_result = await db.execute(
        select(func.count(ContactModel.id)).where(or_(
            ContactModel.status == "inactive 30 days",
            ContactModel.lead_health == "Critical"
        ))
    )
    stale_leads = stale_result.scalar() or 0

    avg_conv_result = await db.execute(select(func.avg(ContactModel.conversion_score)))
    avg_conversion = avg_conv_result.scalar()
    conversion_rate = round(float(avg_conversion), 1) if avg_conversion else 72.5

    follow_up_result = await db.execute(
        select(func.count(ContactModel.id)).where(ContactModel.next_action_date.is_not(None))
    )
    upcoming_follow_ups = follow_up_result.scalar() or 0

    return {
        "total_contacts": total_contacts,
        "active_leads": active_leads,
        "booked_this_week": booked_this_week,
        "stale_leads": stale_leads,
        "conversion_rate": conversion_rate,
        "upcoming_follow_ups": upcoming_follow_ups
    }

@router.get("/", response_model=List[ContactSchema])
async def list_contacts(
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    filter_type: Optional[str] = Query("all", description="Filter type"),
    db: AsyncSession = Depends(get_db)
):
    query = select(ContactModel)

    # 1. Apply Search
    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(
            ContactModel.name.like(search_pattern),
            ContactModel.email.like(search_pattern),
            ContactModel.company.like(search_pattern)
        ))

    # 2. Apply Filters
    if filter_type == "new":
        query = query.where(ContactModel.status == "New")
    elif filter_type == "no_meetings":
        query = query.where(ContactModel.last_meeting.is_(None)).where(ContactModel.next_meeting.is_(None))
    elif filter_type == "inactive_30_days":
        query = query.where(or_(
            ContactModel.status == "inactive 30 days",
            ContactModel.lead_health == "Critical"
        ))
    elif filter_type == "upcoming_meetings":
        query = query.where(ContactModel.next_meeting.is_not(None))
    elif filter_type == "booked_demos":
        query = query.where(or_(
            ContactModel.pipeline_stage == "Demo",
            ContactModel.status == "demo completed"
        ))
    elif filter_type == "warm_leads":
        query = query.where(or_(
            ContactModel.tags.like("%warm_lead%"),
            ContactModel.lead_score.between(70, 85)
        ))
    elif filter_type == "hot_leads":
        query = query.where(or_(
            ContactModel.tags.like("%hot_lead%"),
            ContactModel.lead_score > 85,
            ContactModel.ai_intent_score > 85
        ))

    result = await db.execute(query.order_by(ContactModel.id.desc()))
    return result.scalars().all()

@router.get("/{contact_id}", response_model=ContactSchema)
async def get_contact(contact_id: int, db: AsyncSession = Depends(get_db)):
    contact = await db.get(ContactModel, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.post("/", response_model=ContactSchema)
async def create_contact(obj_in: ContactCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(ContactModel).where(ContactModel.email == obj_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Contact with this email already exists")
    
    db_obj = ContactModel(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.put("/{contact_id}", response_model=ContactSchema)
async def update_contact(contact_id: int, obj_in: ContactUpdate, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(ContactModel, contact_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db_obj.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.delete("/{contact_id}")
async def delete_contact(contact_id: int, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(ContactModel, contact_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    await db.delete(db_obj)
    await db.commit()
    return {"message": "Contact deleted successfully"}

@router.post("/import")
async def import_contacts(contacts_list: List[ContactCreate], db: AsyncSession = Depends(get_db)):
    imported_count = 0
    for item in contacts_list:
        # Check duplicate
        result = await db.execute(select(ContactModel).where(ContactModel.email == item.email))
        if not result.scalar_one_or_none():
            db_obj = ContactModel(**item.model_dump())
            db.add(db_obj)
            imported_count += 1
    
    if imported_count > 0:
        await db.commit()
        
    return {"status": "success", "message": f"Successfully imported {imported_count} contacts"}

@router.post("/export")
async def export_contacts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContactModel))
    contacts = result.scalars().all()
    # Return simple list representing exported data
    data = []
    for c in contacts:
        c_dict = {col.name: getattr(c, col.name) for col in c.__table__.columns}
        # Serialize datetime
        c_dict["created_at"] = c.created_at.isoformat() if c.created_at else None
        c_dict["updated_at"] = c.updated_at.isoformat() if c.updated_at else None
        data.append(c_dict)
    return {"status": "success", "data": data}
