"""
FastAPI router for authentication — /auth prefix.
Exposes endpoints for user registration, login, fetching and updating
the current user profile, changing password, and deleting an account.
Login and register endpoints are rate limited to prevent brute force attacks.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.auth.service import auth_service, get_current_user
from app.auth.models import User
from app.database.base import get_db
from app.utils.rate_limiter import limiter

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    user  = auth_service.register_user(db, req.name, req.email, req.password)
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    user  = auth_service.authenticate_user(db, req.email, req.password)
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, name=current_user.name, email=current_user.email)


class UpdateProfileRequest(BaseModel):
    name:  str
    email: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str


@router.patch("/me", response_model=UserResponse)
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name  = req.name
    current_user.email = req.email
    db.commit()
    db.refresh(current_user)
    return UserResponse(id=current_user.id, name=current_user.name, email=current_user.email)


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not auth_service.verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    current_user.hashed_password = auth_service.hash_password(req.new_password)
    db.commit()
    return {"success": True}


@router.delete("/me")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(current_user)
    db.commit()
    return {"success": True}
