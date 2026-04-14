"""
email_integration/gmail.py — Gmail OAuth2 and API integration.
"""

import base64
import json
from typing import Any

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]


class GmailService:
    """Handles Gmail OAuth2 flow and inbox/send operations."""

    def __init__(self) -> None:
        self._client_config = {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uris": [settings.google_redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

    def get_auth_url(self, state: str = "") -> str:
        """Return the OAuth2 authorisation URL."""
        flow = Flow.from_client_config(
            self._client_config,
            scopes=SCOPES,
            redirect_uri=settings.google_redirect_uri,
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state,
        )
        return auth_url

    def exchange_code(self, code: str) -> dict[str, Any]:
        """Exchange auth code for tokens."""
        flow = Flow.from_client_config(
            self._client_config,
            scopes=SCOPES,
            redirect_uri=settings.google_redirect_uri,
        )
        flow.fetch_token(code=code)
        creds = flow.credentials
        return {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes or []),
        }

    def _build_service(self, token_data: dict[str, Any]):
        """Build an authenticated Gmail API service."""
        creds = Credentials(
            token=token_data["token"],
            refresh_token=token_data.get("refresh_token"),
            token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=token_data.get("client_id", settings.google_client_id),
            client_secret=token_data.get("client_secret", settings.google_client_secret),
        )
        return build("gmail", "v1", credentials=creds)

    def fetch_inbox(self, token_data: dict[str, Any], max_results: int = 20) -> list[dict]:
        """Return a list of inbox email summaries."""
        service = self._build_service(token_data)
        result = (
            service.users()
            .messages()
            .list(userId="me", labelIds=["INBOX"], maxResults=max_results)
            .execute()
        )
        messages = result.get("messages", [])
        inbox = []
        for msg in messages:
            detail = (
                service.users().messages().get(
                    userId="me", id=msg["id"], format="metadata",
                    metadataHeaders=["Subject", "From", "Date"]
                ).execute()
            )
            headers = {h["name"]: h["value"] for h in detail.get("payload", {}).get("headers", [])}
            inbox.append(
                {
                    "id": msg["id"],
                    "subject": headers.get("Subject", "(no subject)"),
                    "from": headers.get("From", ""),
                    "date": headers.get("Date", ""),
                    "snippet": detail.get("snippet", ""),
                }
            )
        return inbox

    def fetch_message(self, token_data: dict[str, Any], message_id: str) -> dict[str, Any]:
        """Return full message content."""
        service = self._build_service(token_data)
        detail = service.users().messages().get(userId="me", id=message_id, format="full").execute()
        headers = {h["name"]: h["value"] for h in detail.get("payload", {}).get("headers", [])}

        body = ""
        payload = detail.get("payload", {})
        if "parts" in payload:
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain":
                    data = part.get("body", {}).get("data", "")
                    body = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
                    break
        else:
            data = payload.get("body", {}).get("data", "")
            if data:
                body = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")

        return {
            "id": message_id,
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "to": headers.get("To", ""),
            "date": headers.get("Date", ""),
            "body": body,
        }

    def send_email(
        self, token_data: dict[str, Any], to: str, subject: str, body: str
    ) -> dict[str, Any]:
        """Send an email via Gmail API."""
        import email.mime.multipart as mime_multi
        import email.mime.text as mime_text

        service = self._build_service(token_data)
        msg = mime_multi.MIMEMultipart()
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(mime_text.MIMEText(body, "plain"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        logger.info("gmail_email_sent", message_id=sent.get("id"))
        return {"message_id": sent.get("id"), "status": "sent"}