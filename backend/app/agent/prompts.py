"""
LLM prompt templates for the MailMind agent pipeline.
Contains functions that return fully formatted prompt strings for each node.
The draft and refine prompts inject the user's reply hint as a critical
instruction so it cannot be overridden at any stage. History is truncated
to the last MAX_HISTORY_EXCHANGES exchanges before injection.
"""
from app.config import settings


class PromptTemplates:
    """Central store for all MailMind agent prompt templates."""

    ANALYZE = """You are an expert email analyst for MailMind.
Analyze the following email and extract structured information.

Respond ONLY as valid JSON with no extra text:
{{
  "intent":    "what the sender wants (e.g. follow-up request, complaint, information request)",
  "sentiment": "positive | neutral | negative",
  "urgency":   "high | medium | low",
  "key_points": ["point 1", "point 2"]
}}

Email:
{email_content}
"""

    DRAFT = """You are MailMind, an expert email reply assistant.

{conversation_history}

Email analysis:
- Intent:    {intent}
- Sentiment: {sentiment}
- Urgency:   {urgency}
- Key points: {key_points}

Relevant context from memory:
{retrieved_context}

Additional context from web search:
{web_results}

Latest email to reply to:
{email_content}

Tone guide:
  - formal:   Professional, structured, respectful. Avoid contractions.
  - friendly: Warm, conversational, approachable. Use natural language.
  - concise:  Short and direct. Use bullet points where appropriate.

Write a {tone} reply to the latest email above.
Use the conversation history to maintain context and avoid repeating information already discussed.

CRITICAL INSTRUCTION — YOU MUST FOLLOW THIS EXACTLY:
{hint}
This instruction overrides everything else. Shape the entire reply around it.

Write ONLY the reply body. Begin directly with a greeting. Do not include a subject line.
"""

    REFINE = """You are a professional editor reviewing an email reply for MailMind.
Lightly improve the reply below for clarity, grammar, and tone consistency ({tone}).
Do NOT change the core content or meaning. Return ONLY the improved reply — nothing else.

CRITICAL: The user gave this instruction when generating this reply: "{hint}"
You MUST ensure the final reply still fully follows this instruction. Do not soften, reverse, or ignore it.

Reply to refine:
{draft_reply}
"""

    CONFIDENCE = """You are evaluating the quality of an AI-generated email reply.
Rate how well the reply addresses the original email on a scale of 0.0 to 1.0.

Consider:
- Does it address all key points from the original email?
- Is the tone appropriate?
- Is it clear and professional?
- Does it follow the user's hint/instruction?

Original email:
{email_content}

Generated reply:
{reply}

Respond ONLY with a single decimal number between 0.0 and 1.0. Nothing else.
"""

    def analyze(self, email_content: str) -> str:
        return self.ANALYZE.format(email_content=email_content)

    def draft(
        self,
        intent: str,
        sentiment: str,
        urgency: str,
        key_points: list,
        retrieved_context: str,
        web_results: str,
        tone: str,
        email_content: str,
        hint: str = "",
        conversation_history: list = [],
    ) -> str:
        # Truncate history to last MAX_HISTORY_EXCHANGES
        max_history = settings.MAX_HISTORY_EXCHANGES
        truncated = conversation_history[-max_history:] if conversation_history else []

        if truncated:
            history_text = "Conversation history (most recent exchanges in this thread):\n"
            for i, turn in enumerate(truncated, 1):
                history_text += f"\n[Exchange {i}]\nIncoming email:\n{turn['email_content']}\n\nYour reply:\n{turn['reply']}\n"
            history_text += "\n---\nNow continue this conversation with the latest email below.\n"
        else:
            history_text = ""

        return self.DRAFT.format(
            conversation_history=history_text,
            intent=intent,
            sentiment=sentiment,
            urgency=urgency,
            key_points=", ".join(key_points) if key_points else "none",
            retrieved_context=retrieved_context or "None",
            web_results=web_results or "None",
            hint=hint.strip() if hint.strip() else "No specific instruction — reply helpfully and naturally.",
            tone=tone,
            email_content=email_content,
        )

    def refine(self, tone: str, draft_reply: str, hint: str = "") -> str:
        return self.REFINE.format(
            tone=tone,
            draft_reply=draft_reply,
            hint=hint.strip() if hint.strip() else "No specific instruction.",
        )

    def confidence(self, email_content: str, reply: str) -> str:
        return self.CONFIDENCE.format(
            email_content=email_content,
            reply=reply,
        )


prompts = PromptTemplates()
