"""
agent/prompts.py — all LLM prompt templates.
"""


class AgentPrompts:
    """Centralised prompt templates for the MailMind agent."""

    SYSTEM_BASE = """You are MailMind, a professional AI email assistant.
Your task is to draft clear, contextually appropriate email replies.
Always match the requested tone, address all questions asked, and be concise.
Never fabricate information — if you're unsure, say so politely."""

    @staticmethod
    def analyze_prompt(email_content: str, analysis_summary: str) -> str:
        return f"""Analyse the following email and provide a brief structured understanding
of what the sender needs, what tone to use, and what the reply must cover.

Email:
{email_content}

Pre-analysis hints:
{analysis_summary}

Respond with a concise paragraph summarising your understanding."""

    @staticmethod
    def draft_prompt(
        email_content: str,
        tone: str,
        hint: str,
        memories: list[dict],
        web_results: list[dict],
        history: list[dict],
        analysis_summary: str,
    ) -> str:
        memory_block = "\n".join(
            f"- {m['content']}" for m in memories
        ) if memories else "No relevant memories."

        web_block = "\n".join(
            f"- {r['title']}: {r['content']}" for r in web_results
        ) if web_results else "No web context available."

        history_block = "\n".join(
            f"Previous email: {h['email_content'][:200]}\nPrevious reply: {h['reply'][:200]}"
            for h in history[-3:]
        ) if history else "No prior conversation."

        return f"""Draft a professional email reply with the following context:

EMAIL TO REPLY TO:
{email_content}

EMAIL ANALYSIS:
{analysis_summary}

TONE: {tone}
HINT FROM USER: {hint or 'None provided'}

RELEVANT MEMORIES:
{memory_block}

WEB CONTEXT:
{web_block}

CONVERSATION HISTORY:
{history_block}

Write only the email reply body — no subject line, no meta-commentary."""

    @staticmethod
    def refine_prompt(draft: str, email_content: str, tone: str, hint: str) -> str:
        return f"""Review and refine the following draft email reply.
Ensure it: fully addresses the original email, matches the {tone} tone,
follows the hint ({hint or 'none'}), and is professionally written.

ORIGINAL EMAIL:
{email_content}

DRAFT REPLY:
{draft}

Return only the improved reply body."""

    @staticmethod
    def confidence_prompt(
        email_content: str, final_reply: str, tone: str, hint: str, memories: list[dict]
    ) -> str:
        memory_used = len(memories) > 0
        return f"""Score the quality of this email reply on a scale of 0-100.
Consider:
1. Context match (0-40): Does the reply address the email content?
2. Tone consistency (0-30): Does it match the requested tone ({tone})?
3. Hint compliance (0-30): Does it follow the user hint ({hint or 'none'})?

Email: {email_content[:500]}
Reply: {final_reply[:500]}
Memory context used: {memory_used}

Respond ONLY with a JSON object like:
{{"context_match": 35, "tone_consistency": 25, "hint_compliance": 28, "total": 88}}"""
