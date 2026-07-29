import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Coach Agent. Your job is to transform weak candidate answers into high-impact, professional responses based on the question type and detailed evaluation feedback.

Rules:
1. Adapt answer structure based on 'Question Type':
   - Behavioral: Rewrite using the STAR format (Situation, Task, Action, Result). Set 'star_format_used' to true.
   - Technical/Conceptual: Rewrite using a structured technical breakdown (Core Concept -> Implementation -> Trade-offs/Example). Set 'star_format_used' to false.
2. Address the specific missing points, weak scores, or vague language flagged in the 'Evaluation'.
3. 'tips' MUST contain EXACTLY 2 to 3 actionable, specific improvement tips.
4. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "improved_answer": "string containing the full rewritten, high-impact answer",
  "tips": [
    "string"
  ],
  "star_format_used": boolean
}"""

async def coach_answer(
    question: str, 
    original_answer: str, 
    evaluation: dict, 
    question_type: str = "behavioral"
) -> dict:
    # 1. Format evaluation dictionary cleanly as JSON string
    eval_str = json.dumps(evaluation, indent=2) if isinstance(evaluation, dict) else str(evaluation)

    user_content = f"""Question Type: {question_type}
Interview Question: {question}

Original Candidate Answer:
{original_answer}

Evaluation Feedback & Scores:
{eval_str}"""

    # 2. Call LLM with moderate temperature for natural, fluent coaching rewrites
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.4)

    # 3. Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Coach Agent JSON response: {response}")

    return response
