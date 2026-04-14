"""
email_integration/outlook.py — Microsoft Graph API for Outlook OAuth2.
"""

import json
from typing import Any

import httpx
import msal

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
SCOPES = ["Mail.Read", "Mail.Send", "offline_access"]


class OutlookService:
    """Handles Microsoft/Outlook OAuth2 and inbox/send via Graph API."""

    def __init__(self) -> None:
        self._app = msal.ConfidentialClientApplication(
            client_id=settings.microsoft_client_id,
            client_credential=settings.microsoft_client_secret,
            authority="https://login.microsoftonline.com/common",
        )

    def get_auth_url(self) -> str:
        """Return the OAuth2 authorisation URL."""
        result = self._app.get_authorization_request_url(
            scopes=SCOPES,
            redirect_uri=settings.microsoft_redirect_uri,
        )
        return result

    def exchange_code(self, code: str) -> dict[str, Any]:
        """Exchange auth code for tokens."""
        result = self._app.acquire_token_by_authorization_code(
            code=code,
            scopes=SCOPES,
            redirect_uri=settings.microsoft_redirect_uri,
        )
        if "error" in result:
            raise ValueError(f"Token exchange failed: {result.get('error_description')}")
        return {
            "access_token": result["access_token"],
            "refresh_token": result.get("refresh_token", ""),
            "expires_in": result.get("expires_in", 3600),
        }

    async def _get_headers(self, token_data: dict[str, Any]) -> dict[str, str]:
        return {"Authorization": f"Bearer {token_data['access_token']}"}

    async def fetch_inbox(self, token_data: dict[str, Any], max_results: int = 20) -> list[dict]:
        """Return inbox email summaries from Outlook."""
        headers = await self._get_headers(token_data)
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GRAPH_BASE}/me/mailFolders/inbox/messages",
                headers=headers,
                params={"$top": max_results, "$select": "id,subject,from,receivedDateTime,bodyPreview"},
            )
            resp.raise_for_status()
            data = resp.json()

        inbox = []
        for msg in data.get("value", []):
            inbox.append(
                {
                    "id": msg["id"],
                    "subject": msg.get("subject", "(no subject)"),
                    "from": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                    "date": msg.get("receivedDateTime", ""),
                    "snippet": msg.get("bodyPreview", ""),
                }
            )
        return inbox

    async def fetch_message(self, token_data: dict[str, Any], message_id: str) -> dict[str, Any]:
        """Return full message content from Outlook."""
        headers = await self._get_headers(token_data)
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GRAPH_BASE}/me/messages/{message_id}",
                headers=headers,
                params={"$select": "id,subject,from,toRecipients,receivedDateTime,body"},
            )
            resp.raise_for_status()
            msg = resp.json()

        return {
            "id": msg["id"],
            "subject": msg.get("subject", ""),
            "from": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
            "to": ", ".join(
                r["emailAddress"]["address"]
                for r in msg.get("toRecipients", [])
            ),
            "date": msg.get("receivedDateTime", ""),
            "body": msg.get("body", {}).get("content", ""),
        }

    async def send_email(
        self, token_data: dict[str, Any], to: str, subject: str, body: str
    ) -> dict[str, Any]:
        """Send an email via Microsoft Graph."""
        headers = await self._get_headers(token_data)
        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "Text", "content": body},
                "toRecipients": [{"emailAddress": {"address": to}}],
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GRAPH_BASE}/me/sendMail",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
        logger.info("outlook_email_sent", to=to)
        return {"status": "sent"}
