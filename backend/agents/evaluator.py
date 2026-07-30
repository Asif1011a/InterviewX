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

Relevance Evaluation Rule (CRITICAL):
- If the candidate's answer is IRRELEVANT or OFF-TOPIC regarding the asked question (e.g. talking about unrelated topics, sports, movies, weather, or answering a different question), set 'is_irrelevant' to true, set content_score to 1, and write a clear 1-sentence 'relevance_explanation' explaining why the answer is off-topic.

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
  "is_irrelevant": false,
  "relevance_explanation": "",
  "missing_points": ["Explanation of indexing strategy", "Handling concurrency lock contention"],
  "strengths": ["Clear explanation of Redis caching", "Quantified 40% latency reduction"]
}"""

async def evaluate_answer(question: str, answer: str, topic: str, role: str) -> dict:
    ans_clean = answer.strip().lower()
    dont_know_phrases = [
        "i don't know", "dont know", "no idea", "i have no idea", "not sure",
        "i am not sure", "pass", "skip", "i don't have experience", "dunno",
        "i do not know", "i'm not sure", "no concept", "no answer", "idk"
    ]
    is_dont_know = any(phrase in ans_clean for phrase in dont_know_phrases) or len(ans_clean.split()) <= 2

    if is_dont_know:
        return {
            "content_score": 0,
            "clarity_score": 0,
            "confidence_score": 0,
            "structure_score": 0,
            "depth_score": 0,
            "overall_score": 0.0,
            "is_dont_know": True,
            "is_irrelevant": False,
            "relevance_explanation": "",
            "missing_points": [f"Candidate skipped or indicated un-learned concept for '{topic}'.", "Requires foundational learning path study."],
            "strengths": ["Honest identification of an un-learned technical topic."]
        }

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

    is_irrelevant = bool(res.get("is_irrelevant", False))
    content = max(1, min(10, int(res.get("content_score", 1 if is_irrelevant else 6))))
    clarity = max(1, min(10, int(res.get("clarity_score", 6))))
    confidence = max(1, min(10, int(res.get("confidence_score", 6))))
    structure = max(1, min(10, int(res.get("structure_score", 6))))
    depth = max(1, min(10, int(res.get("depth_score", 1 if is_irrelevant else 6))))

    overall = round((content + clarity + confidence + structure + depth) / 5.0, 1)

    rel_exp = res.get("relevance_explanation") or ""
    if is_irrelevant and not rel_exp:
        rel_exp = f"Your response is off-topic and does not address the specific technical core of '{question}'."

    return {
        "content_score": content,
        "clarity_score": clarity,
        "confidence_score": confidence,
        "structure_score": structure,
        "depth_score": depth,
        "overall_score": overall,
        "is_dont_know": False,
        "is_irrelevant": is_irrelevant,
        "relevance_explanation": rel_exp,
        "missing_points": res.get("missing_points") or [f"Answer failed to address {topic}."],
        "strengths": res.get("strengths") or ["Clear vocal tone."]
    }
