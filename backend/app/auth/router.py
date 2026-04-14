"""
auth/router.py — authentication endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import TokenResponse, UserRegisterRequest, UserResponse
from app.auth.service import AuthService
from app.database.connection import get_db
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """FastAPI dependency — returns the authenticated User or raises 401."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        service = AuthService(db)
        user_id_str = service.decode_token(token)
        user = await service.get_by_id(uuid.UUID(user_id_str))
    except (JWTError, ValueError):
        raise credentials_exc
    if user is None or not user.is_active:
        raise credentials_exc
    return user


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    service = AuthService(db)
    try:
        user = await service.register(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    service = AuthService(db)
    user = await service.authenticate(form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = service.create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
