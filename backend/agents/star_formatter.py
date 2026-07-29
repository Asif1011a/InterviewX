import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a STAR Format Expert Agent. Your job is to transform raw interview answers into polished, high-impact STAR (Situation, Task, Action, Result) answers.

Rules:
1. Extract or infer Situation, Task, Action, and Result from the raw answer. 
2. 'Action' must be the most detailed and longest section.
3. If the candidate omitted specific metrics in their raw answer, use realistic placeholders in brackets like '[X%]' or '[Y hours]' in the formatted answer, and flag this in 'missing_elements'.
4. 'missing_elements' MUST list what was lacking in the raw answer (e.g., missing metrics, unclear personal impact, vague resolution).
5. 'original_quality' is an integer rating (1-10) of the raw answer.
6. 'star_score' is an integer rating (1-10) of the newly formatted answer.
7. Return ONLY valid JSON matching the schema below. Do NOT include markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "original_quality": 4,
  "star_score": 9,
  "situation": "Context or challenge background",
  "task": "Specific responsibility or objective",
  "action": "Detailed steps taken (emphasize personal leadership and key tech/tools)",
  "result": "Quantifiable outcome and business impact",
  "formatted_answer": "Full professional response in 150-200 words, fluent and confident.",
  "improvements_made": ["string"],
  "power_words_added": ["string"],
  "missing_elements": ["string"]
}"""

async def format_star(question: str, raw_answer: str, role: str) -> dict:
    user_content = f"""Target Role: {role}
Interview Question: {question}

Raw Candidate Answer:
{raw_answer}"""

    # Call LLM with low temperature for consistent formatting
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.3)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse STAR Formatter JSON response: {response}")

    return response
