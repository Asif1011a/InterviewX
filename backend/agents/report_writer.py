import json
import re
from datetime import datetime, timezone
from .base import call_llm

SYSTEM_PROMPT = """You are a Report Writer Agent. Your job is to compile a candidate's mock interview session data into a concise, professional executive readiness report.

Rules:
1. 'overall_readiness' must be an integer (0-100) reflecting holistic interview readiness.
2. 'answer_highlights' must contain real highlights extracted from the evaluation data provided.
3. 'key_strengths' and 'key_gaps' must reference specific skills and topics from the session.
4. 'recommendations' MUST contain 2 to 3 actionable, prioritized next steps.
5. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "title": "Interview Readiness Report",
  "student_name": "string",
  "role": "string",
  "date": "YYYY-MM-DD",
  "overall_readiness": 72,
  "executive_summary": "2-3 sentence executive summary of candidate performance",
  "key_strengths": ["string"],
  "key_gaps": ["string"],
  "answer_highlights": [
    {
      "question": "string",
      "score": 8,
      "note": "string explaining score rationale based on performance"
    }
  ],
  "recommendations": ["string"],
  "verdict": "string summarizing readiness timeline and next steps"
}"""

async def write_report(session_data: dict) -> dict:
    # 1. Cleanly extract student & role details with safe defaults
    student_name = session_data.get("student_name", "Candidate")
    target_role = session_data.get("target_role", "Software Engineer")
    session_date = session_data.get("created_at") or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 2. Extract analytics with fallbacks
    analytics = session_data.get("analytics") or {}
    readiness_score = analytics.get("readiness_score", 0)
    weak_topics = analytics.get("weak_topics", [])
    strong_topics = analytics.get("strong_topics", [])

    # 3. Construct rich evaluation highlights (passing evidence to prevent hallucinated notes)
    evaluations = session_data.get("evaluations", [])
    summary_evals = []
    
    for e in evaluations[:5]:  # Capture top 5 evaluation summaries
        eval_obj = e.get("evaluation", {})
        summary_evals.append({
            "question": e.get("question", "")[:100],
            "score": eval_obj.get("overall_score", 0),
            "strengths": eval_obj.get("strengths", [])[:2],
            "missing_points": eval_obj.get("missing_points", [])[:2]
        })

    user_content = f"""Student Name: {student_name}
Target Role: {target_role}
Report Date: {session_date}
Readiness Score: {readiness_score}/100

Weak Topics: {weak_topics}
Strong Topics: {strong_topics}

Evaluations Summary:
{json.dumps(summary_evals, indent=2)}"""

    # 4. Call LLM with moderate temperature for polished executive writing
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.3)

    # 5. Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Report Writer JSON response: {response}")
    else:
        result = response

    # 6. Ensure deterministic date and identity details match input exactly
    result["student_name"] = student_name
    result["role"] = target_role
    result["date"] = session_date

    return result
