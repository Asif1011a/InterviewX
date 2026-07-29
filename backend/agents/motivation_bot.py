import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Motivation Coach Agent. Your job is to convert raw interview performance analytics into an inspiring, data-backed, and actionable closing message.

Rules:
1. Calibrate tone based on Readiness Score:
   - Score >= 80: High-energy polish, focus on locking in the offer.
   - Score 50-79: Constructive encouragement, highlight clear path to the bar.
   - Score < 50: Empathetic, momentum-building, focus on small immediate wins.
2. The 'affirmation' MUST use the candidate's actual Readiness Score (e.g., "At X%, you're just 3 targeted practice sessions away from Y%.").
3. Provide EXACTLY 3 concrete, high-priority next steps referencing their actual weak topics.
4. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or extra text.

JSON Schema:
{
  "message": "Personalized 2-3 sentence encouraging summary referencing specific strong points and growth areas.",
  "emoji": "💪",
  "next_steps": [
    "string"
  ],
  "affirmation": "Short, powerful one-liner dynamically referencing their actual readiness score.",
  "estimated_ready_in": "string (e.g., '3-5 days', '2 weeks')"
}"""

async def motivate_student(analytics: dict, role: str, student_name: str = "Candidate") -> dict:
    readiness_score = analytics.get('readiness_score', 0)
    weak_topics = analytics.get('weak_topics', ['Interview Answer Structure'])
    strong_topics = analytics.get('strong_topics', ['Communication'])

    user_content = f"""Student Name: {student_name}
Target Role: {role}
Actual Readiness Score: {readiness_score}/100
Answers Evaluated: {analytics.get('answers_evaluated', 0)}
Strong Topics: {strong_topics}
Weak Topics to Improve: {weak_topics}"""

    # Call LLM with temperature=0.7 for warm, empathetic coaching language
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.7)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Motivation Bot JSON response: {response}")

    return response
