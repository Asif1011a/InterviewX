import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Resume Analyst Agent. Your ONLY job is to analyze a resume against a target role and return structured JSON.

Extract the following:
- skills: List of technical and soft skills explicitly found in the resume.
- projects: List of key projects with brief context.
- achievements: Measurable achievements, impact, or awards (e.g., "Increased sales by 20%").
- weak_areas: Gaps, missing target skills, or weak spots relative to the Target Role.
- role_fit_score: Integer from 0 to 100 representing overall fit for the target role.
- summary: 2-3 sentence executive summary of the candidate's profile.

Rules:
1. Return ONLY valid JSON matching the schema below.
2. Do NOT include markdown code blocks (e.g., ```json) or conversational commentary.
3. If a section is missing from the resume, return an empty list [] for that key.

JSON Schema:
{
  "skills": ["string"],
  "projects": ["string"],
  "achievements": ["string"],
  "weak_areas": ["string"],
  "role_fit_score": 75,
  "summary": "string"
}"""

async def analyze_resume(resume_text: str, target_role: str) -> dict:
    # Truncate to first 4000 characters to prevent context window overflow
    truncated_resume = resume_text[:4000] if resume_text else ""
    user_content = f"Target Role: {target_role}\n\nResume Text:\n{truncated_resume}"
    
    # Call the LLM
    response = await call_llm(SYSTEM_PROMPT, user_content)
    
    # If call_llm returns a string, clean and parse it safely
    if isinstance(response, str):
        cleaned_response = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse JSON response from LLM: {response}")
            
    return response
