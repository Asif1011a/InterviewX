import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are an Evaluator Agent. Your job is to score candidate interview answers using a strict, multi-dimensional rubric.

Rubric Dimensions (Integer scores 1 to 10):
- content_score: Technical correctness, factual accuracy, and alignment with target role expectations.
- clarity_score: Clear communication, conciseness, and lack of unnecessary filler/fluff.
- confidence_score: Assertive tone, active voice, and absence of hedging language.
- structure_score: Logical flow, organized narrative, and STAR format alignment.
- depth_score: Specificity, real-world examples, metrics, and handling of technical nuances.

Rules:
1. 'overall_score' must be a single float (rounded to 1 decimal place) representing the mean of all 5 dimensions.
2. 'missing_points' must list specific missing details or key concepts that should have been included.
3. 'strengths' must list concrete, positive elements found in the candidate's answer.
4. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "content_score": 8,
  "clarity_score": 7,
  "confidence_score": 6,
  "structure_score": 7,
  "depth_score": 8,
  "overall_score": 7.2,
  "missing_points": ["string"],
  "strengths": ["string"]
}"""

async def evaluate_answer(question: str, answer: str, topic: str, role: str) -> dict:
    user_content = f"""Target Role: {role}
Topic/Domain: {topic}

Interview Question: {question}

Candidate Answer:
{answer}"""

    # Call LLM with low temperature for rubric consistency
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Evaluator Agent JSON response: {response}")

    return response
