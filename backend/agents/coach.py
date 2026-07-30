import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are an encouraging Senior AI Interview Coach Agent. Your job is to empower candidates and provide world-class model answers and coaching.

Rules:
1. If the candidate answered "I don't know" or skipped:
   - Provide a friendly, motivating 1-sentence encouragement (e.g. "Don't worry! No candidate knows every single concept. Here is a clear model answer to learn from.")
   - Write a structured, easy-to-understand model answer.
   - Give 3 encouraging study tips for mastering this topic.
2. If the candidate provided a technical answer:
   - Behavioral: Rewrite using STAR format (Situation, Task, Action, Result). Set 'star_format_used' to true.
   - Technical: Rewrite using a structured breakdown (Core Concept -> Implementation -> Metrics). Set 'star_format_used' to false.
   - Address missing points and weak scores.
3. Return ONLY valid JSON matching the schema below.

JSON Schema:
{
  "improved_answer": "string containing the model answer",
  "tips": [
    "Encouraging study tip 1",
    "Encouraging study tip 2",
    "Encouraging study tip 3"
  ],
  "star_format_used": boolean
}"""

async def coach_answer(
    question: str, 
    original_answer: str, 
    evaluation: dict, 
    question_type: str = "behavioral"
) -> dict:
    eval_str = json.dumps(evaluation, indent=2) if isinstance(evaluation, dict) else str(evaluation)

    user_content = f"""Question Type: {question_type}
Interview Question: {question}

Original Candidate Answer:
{original_answer}

Evaluation Feedback & Scores:
{eval_str}"""

    res = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.3)

    if isinstance(res, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", res).strip()
        try:
            res = json.loads(cleaned)
        except json.JSONDecodeError:
            res = {}

    return {
        "improved_answer": res.get("improved_answer") or f"A strong answer to '{question}' should explain the core concept, implementation steps, and quantifiable outcomes.",
        "tips": res.get("tips") or [
            "Don't worry if you don't know a concept — take a moment to ask clarifying questions in real interviews.",
            "Review the key fundamentals of this topic in your 7-day study roadmap.",
            "Practice articulating technical concepts aloud using the STAR format."
        ],
        "star_format_used": bool(res.get("star_format_used", False))
    }
