import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are an ATS (Applicant Tracking System) Scorer Agent. Your job is to rigorously parse and score a candidate's resume against a target Job Description (JD) using standard ATS parsing algorithms.

Rules:
1. 'ats_match_score', 'keyword_density_score', and all 'section_scores' MUST be integers between 0 and 100.
2. Section scores: If a section (e.g., projects_section) is missing entirely from the resume, score it below 30.
3. Extract exact missing critical keywords directly from the JD that do not appear in the resume.
4. Align 'ats_pass_prediction' with 'ats_match_score':
   - Score >= 75: High probability of passing automated ATS screens.
   - Score 50-74: Moderate pass chance; needs targeted keyword tuning.
   - Score < 50: High risk of failing initial ATS filters.
5. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "ats_match_score": 68,
  "keyword_analysis": {
    "matched_keywords": ["string"],
    "missing_critical_keywords": ["string"],
    "partially_matched": ["string"],
    "keyword_density_score": 62
  },
  "section_scores": {
    "skills_section": 75,
    "experience_section": 65,
    "education_section": 90,
    "projects_section": 70
  },
  "formatting_issues": ["string"],
  "recommended_additions": ["string"],
  "resume_strength": "string summarizing core strengths",
  "ats_pass_prediction": "string detailing pass likelihood and strictness warnings"
}"""

async def score_ats(resume_text: str, jd_text: str) -> dict:
    # Pass full text (or clean window up to reasonable token limit) to prevent truncation loss
    user_content = f"""Target Job Description:
{jd_text}

Candidate Resume:
{resume_text}"""

    # Call LLM with low temperature for accurate, grounded ATS keyword extraction
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse ATS Scorer JSON response: {response}")

    return response
