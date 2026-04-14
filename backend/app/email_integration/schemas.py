"""
email_integration/schemas.py — schemas for inbox and send operations.
"""

from pydantic import BaseModel, EmailStr


class InboxItem(BaseModel):
    id: str
    subject: str
    from_address: str
    date: str
    snippet: str

    model_config = {"from_attributes": True}


class EmailMessage(BaseModel):
    id: str
    subject: str
    from_address: str
    to: str
    date: str
    body: str


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    provider: str = "gmail"  # gmail | outlook


class SendEmailResponse(BaseModel):
    status: str
    message_id: str | None = None
