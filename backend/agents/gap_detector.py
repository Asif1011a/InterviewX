import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Gap Detector Agent. Your job is to compare a candidate's resume skills against target role requirements and construct a precise skill gap matrix.

Rules:
1. 'severity' MUST be strictly one of: ["none", "low", "medium", "high"].
2. 'student_level' and 'required_level' MUST be strictly one of: ["none", "beginner", "intermediate", "advanced"].
3. 'gap_score' is an integer (0-100) where 100 represents a perfect skill match and 0 represents severe missing qualifications.
4. 'critical_gaps' must list skills marked with 'high' severity that are critical for the target role.
5. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "gap_matrix": [
    {
      "skill": "string",
      "student_level": "none | beginner | intermediate | advanced",
      "required_level": "none | beginner | intermediate | advanced",
      "severity": "none | low | medium | high"
    }
  ],
  "critical_gaps": ["string"],
  "strengths": ["string"],
  "gap_score": 70,
  "gap_summary": "2-sentence executive summary of primary skill gaps and alignment."
}"""

async def detect_gaps(resume_text: str, target_role: str) -> dict:
    truncated_resume = resume_text[:4000] if resume_text else ""
    user_content = f"""Target Role: {target_role}

Resume Text:
{truncated_resume}"""

    # Call LLM with low temperature for consistent skill evaluation
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Gap Detector JSON response: {response}")

    return response
