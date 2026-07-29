import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a JD Analyst Agent — an expert at dissecting job descriptions to extract keywords, hidden hiring signals, and tailored interview questions.

Rules:
1. Extract exact phrases and keywords explicitly mentioned in the Job Description.
2. Differentiate strictly between 'must_have_skills' (required) and 'good_to_have_skills' (preferred/plus).
3. 'ats_keywords' should contain exact hard skills, tools, frameworks, and methodologies mentioned.
4. 'hidden_culture_signals' should capture work style cues (e.g., "fast-paced", "ownership", "cross-functional").
5. If certain sections cannot be determined from the JD, return an empty list [] for that key.
6. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or extra text.

JSON Schema:
{
  "role_title": "string",
  "must_have_skills": ["string"],
  "good_to_have_skills": ["string"],
  "hidden_culture_signals": ["string"],
  "ats_keywords": ["string"],
  "red_flags_to_avoid": ["string"],
  "tailored_questions": [
    {
      "question": "string",
      "type": "technical | behavioral | system_design | culture",
      "why_asked": "string"
    }
  ],
  "resume_gap_alert": "string describing key skills in JD likely missing from average resumes",
  "interview_prediction": "string predicting expected interview rounds"
}"""

async def analyze_jd(jd_text: str, candidate_role: str) -> dict:
    user_content = f"""Candidate Role Applied For: {candidate_role}

Job Description:
{jd_text}"""

    # Call LLM with low temperature for accurate ground-truth extraction
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse JD Analyst JSON response: {response}")

    return response
