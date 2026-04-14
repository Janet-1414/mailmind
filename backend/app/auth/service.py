"""
auth/service.py — JWT creation/verification and password hashing.
"""

import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.schemas import UserRegisterRequest
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Handles user registration, login, and JWT operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Password helpers ─────────────────────────────────────────

    @staticmethod
    def hash_password(plain: str) -> str:
        return _pwd_context.hash(plain)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return _pwd_context.verify(plain, hashed)

    # ── JWT helpers ──────────────────────────────────────────────

    @staticmethod
    def create_access_token(subject: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        payload = {"sub": subject, "exp": expire}
        return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

    @staticmethod
    def decode_token(token: str) -> str:
        """Return the subject (user_id) or raise JWTError."""
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub: str | None = payload.get("sub")
        if sub is None:
            raise JWTError("Token missing subject")
        return sub

    # ── User operations ──────────────────────────────────────────

    async def register(self, data: UserRegisterRequest) -> User:
        existing = await self._db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            email=data.email,
            hashed_password=self.hash_password(data.password),
            full_name=data.full_name,
        )
        self._db.add(user)
        await self._db.flush()
        logger.info("user_registered", user_id=str(user.id))
        return user

    async def authenticate(self, email: str, password: str) -> User | None:
        result = await self._db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
