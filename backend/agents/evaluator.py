import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are an Evaluator Agent. Score candidate interview answers using a strict, multi-dimensional rubric.

Rubric Dimensions (Integer scores 1 to 10):
- content_score: Technical correctness, factual accuracy, and alignment with target role expectations (1 to 10).
- clarity_score: Clear communication, conciseness, and lack of unnecessary filler/fluff (1 to 10).
- confidence_score: Assertive tone, active voice, and absence of hedging language (1 to 10).
- structure_score: Logical flow, organized narrative, and STAR format alignment (1 to 10).
- depth_score: Specificity, real-world examples, metrics, and handling of technical nuances (1 to 10).

Scoring Guidelines:
- Exceptional/FAANG-level answer with concrete metrics and specifics: 8 to 10
- Good answer with minor missing details: 6 to 7
- Average or basic answer lacking depth: 4 to 5
- Weak, extremely short, or vague answer: 1 to 3

Rules:
1. 'overall_score' MUST be the exact average (mean) of all 5 dimension scores on a 1.0 to 10.0 scale.
2. 'missing_points' must list specific missing details or key concepts that should have been included.
3. 'strengths' must list concrete, positive elements found in the candidate's answer.
4. Return ONLY valid JSON matching the schema below.

JSON Schema:
{
  "content_score": 8,
  "clarity_score": 7,
  "confidence_score": 6,
  "structure_score": 7,
  "depth_score": 8,
  "overall_score": 7.2,
  "missing_points": ["Explanation of indexing strategy", "Handling concurrency lock contention"],
  "strengths": ["Clear explanation of Redis caching", "Quantified 40% latency reduction"]
}"""

async def evaluate_answer(question: str, answer: str, topic: str, role: str) -> dict:
    user_content = f"""Target Role: {role}
Topic/Domain: {topic}

Interview Question: {question}

Candidate Answer:
{answer}"""

    # Call LLM with low temperature for rubric consistency
    res = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    if isinstance(res, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", res).strip()
        try:
            res = json.loads(cleaned)
        except json.JSONDecodeError:
            res = {}

    # Ensure deterministic out-of-10 scoring & exact mean overall_score
    content = max(1, min(10, int(res.get("content_score", 6))))
    clarity = max(1, min(10, int(res.get("clarity_score", 6))))
    confidence = max(1, min(10, int(res.get("confidence_score", 6))))
    structure = max(1, min(10, int(res.get("structure_score", 6))))
    depth = max(1, min(10, int(res.get("depth_score", 6))))

    overall = round((content + clarity + confidence + structure + depth) / 5.0, 1)

    return {
        "content_score": content,
        "clarity_score": clarity,
        "confidence_score": confidence,
        "structure_score": structure,
        "depth_score": depth,
        "overall_score": overall,
        "missing_points": res.get("missing_points") or ["Provide more specific technical metrics.", "Explain trade-offs and edge cases."],
        "strengths": res.get("strengths") or ["Good communication clarity.", "Relevant concepts mentioned."]
    }
