"""
email_integration/router.py — OAuth2 callbacks, inbox fetch, and send endpoints.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.router import get_current_user
from app.database.connection import get_db
from app.email_integration.gmail import GmailService
from app.email_integration.outlook import OutlookService
from app.email_integration.schemas import (
    EmailMessage,
    InboxItem,
    SendEmailRequest,
    SendEmailResponse,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/email", tags=["email"])

_gmail = GmailService()
_outlook = OutlookService()


# ── Gmail OAuth2 ─────────────────────────────────────────────────

@router.get("/gmail/auth")
async def gmail_auth(current_user=Depends(get_current_user)):
    """Redirect user to Google OAuth2 consent screen."""
    # Pass user_id as state so callback knows who to save tokens for
    url = _gmail.get_auth_url(state=str(current_user.id))
    return {"auth_url": url}


@router.get("/gmail/callback")
async def gmail_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Handle Gmail OAuth2 callback and store tokens."""
    if error:
        logger.warning("gmail_oauth_error", error=error)
        return RedirectResponse(url=f"http://localhost:3000/settings?gmail_error={error}")

    if not code or not state:
        return RedirectResponse(url="http://localhost:3000/settings?gmail_error=missing_params")

    try:
        token_data = _gmail.exchange_code(code)
        result = await db.execute(select(User).where(User.id == state))
        user = result.scalar_one_or_none()
        if not user:
            return RedirectResponse(url="http://localhost:3000/settings?gmail_error=user_not_found")
        user.gmail_token = json.dumps(token_data)
        await db.flush()
        logger.info("gmail_connected", user_id=state)
        return RedirectResponse(url="http://localhost:3000/settings?gmail=connected")
    except Exception as exc:
        logger.error("gmail_callback_error", error=str(exc))
        return RedirectResponse(url="http://localhost:3000/settings?gmail_error=callback_failed")


@router.get("/gmail/inbox", response_model=list[InboxItem])
async def gmail_inbox(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[InboxItem]:
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    if not user.gmail_token:
        raise HTTPException(status_code=400, detail="Gmail not connected")
    token_data = json.loads(user.gmail_token)
    emails = _gmail.fetch_inbox(token_data)
    return [
        InboxItem(
            id=e["id"],
            subject=e["subject"],
            from_address=e["from"],
            date=e["date"],
            snippet=e["snippet"],
        )
        for e in emails
    ]


@router.get("/gmail/message/{message_id}", response_model=EmailMessage)
async def gmail_message(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> EmailMessage:
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    if not user.gmail_token:
        raise HTTPException(status_code=400, detail="Gmail not connected")
    token_data = json.loads(user.gmail_token)
    msg = _gmail.fetch_message(token_data, message_id)
    return EmailMessage(
        id=msg["id"],
        subject=msg["subject"],
        from_address=msg["from"],
        to=msg["to"],
        date=msg["date"],
        body=msg["body"],
    )


# ── Outlook OAuth2 ───────────────────────────────────────────────

@router.get("/outlook/auth")
async def outlook_auth(current_user=Depends(get_current_user)):
    url = _outlook.get_auth_url()
    return {"auth_url": url}


@router.get("/outlook/callback")
async def outlook_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error:
        return RedirectResponse(url=f"http://localhost:3000/settings?outlook_error={error}")

    if not code or not state:
        return RedirectResponse(url="http://localhost:3000/settings?outlook_error=missing_params")

    try:
        token_data = _outlook.exchange_code(code)
        result = await db.execute(select(User).where(User.id == state))
        user = result.scalar_one_or_none()
        if not user:
            return RedirectResponse(url="http://localhost:3000/settings?outlook_error=user_not_found")
        user.outlook_token = json.dumps(token_data)
        await db.flush()
        logger.info("outlook_connected", user_id=state)
        return RedirectResponse(url="http://localhost:3000/settings?outlook=connected")
    except Exception as exc:
        logger.error("outlook_callback_error", error=str(exc))
        return RedirectResponse(url="http://localhost:3000/settings?outlook_error=callback_failed")


@router.get("/outlook/inbox", response_model=list[InboxItem])
async def outlook_inbox(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[InboxItem]:
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    if not user.outlook_token:
        raise HTTPException(status_code=400, detail="Outlook not connected")
    token_data = json.loads(user.outlook_token)
    emails = await _outlook.fetch_inbox(token_data)
    return [
        InboxItem(
            id=e["id"],
            subject=e["subject"],
            from_address=e["from"],
            date=e["date"],
            snippet=e["snippet"],
        )
        for e in emails
    ]


# ── Unified send ─────────────────────────────────────────────────

@router.post("/send", response_model=SendEmailResponse)
async def send_email(
    data: SendEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SendEmailResponse:
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()

    if data.provider == "gmail":
        if not user.gmail_token:
            raise HTTPException(status_code=400, detail="Gmail not connected")
        token_data = json.loads(user.gmail_token)
        resp = _gmail.send_email(token_data, str(data.to), data.subject, data.body)
        return SendEmailResponse(status=resp["status"], message_id=resp.get("message_id"))

    elif data.provider == "outlook":
        if not user.outlook_token:
            raise HTTPException(status_code=400, detail="Outlook not connected")
        token_data = json.loads(user.outlook_token)
        resp = await _outlook.send_email(token_data, str(data.to), data.subject, data.body)
        return SendEmailResponse(status=resp["status"])

    raise HTTPException(status_code=400, detail="Invalid provider. Use 'gmail' or 'outlook'")