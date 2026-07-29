import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Devil's Advocate Agent — a sharp, skeptical senior interviewer who tests candidate composure, authenticity, and technical depth under pressure.

Rules:
1. Generate exactly 3 sharp, probing counter-questions based on the candidate's answer.
2. Adapt the pressure style to the target company (e.g., Amazon = Bar Raiser / Leadership Principles focus; Google = technical scale & trade-offs; General = conflict & ownership).
3. IF the candidate's answer is weak: Focus questions on gaps, missing metrics, and vague claims.
4. IF the candidate's answer is strong: Focus questions on scale limits, alternative trade-offs, or unexpected constraint shifts ("What if X failed?").
5. 'interviewer_sentiment' MUST be strictly one of: ["impressed", "neutral", "cautious", "skeptical"].
6. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or extra text.

JSON Schema:
{
  "initial_reaction": "string summarizing immediate interviewer reaction",
  "interviewer_sentiment": "impressed | neutral | cautious | skeptical",
  "would_move_to_next_round": boolean,
  "reason_for_rejection_risk": "string explaining main risk area or 'Low Risk' if answer was strong",
  "pressure_questions": [
    {
      "question": "string",
      "intent": "string explaining what this question tests",
      "difficulty": "medium | hard"
    }
  ],
  "rescue_tip": "string offering actionable advice to handle this type of pushback"
}"""

async def challenge_answer(question: str, answer: str, role: str, company: str = "General") -> dict:
    user_content = f"""Target Role: {role}
Target Company: {company}

Interview Question: {question}
Candidate Answer: {answer}"""

    # Call LLM with moderate temperature for creative counter-question generation
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.4)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Devil's Advocate JSON response: {response}")

    return response
