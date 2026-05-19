from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.user import user_repo
from app.schemas.user import UserCreate, User as UserSchema
from app.schemas.token import Token
from app.services import auth
from app.config import settings

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register(obj_in: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, email=obj_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    obj_in.password = auth.get_password_hash(obj_in.password)
    # We need to transform obj_in to match model if schema is different, 
    # but here UserCreate password field is 'password' while model is 'password_hash'
    user_data = obj_in.model_dump()
    password = user_data.pop("password")
    user_data["password_hash"] = password
    
    from app.models.user import User
    db_obj = User(**user_data)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, email=credentials.email)
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
