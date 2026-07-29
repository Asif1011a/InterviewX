import json
import os
import re
from .base import call_llm

_PROFILES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "company_profiles.json")

def _load_profiles() -> dict:
    try:
        with open(_PROFILES_PATH, "r") as f:
            data = json.load(f)
            # Store keys in lowercase for case-insensitive lookup
            return {k.lower(): v for k, v in data.items()}
    except Exception:
        return {}

SYSTEM_PROMPT = """You are a Company Intel Agent. Your job is to analyze target employers and provide role-specific interview formats, focus areas, and hiring nuances.

Rules:
1. If 'Known Profile' contains data, treat it as ground truth, but adapt the details specifically for the requested Target Role.
2. If 'Known Profile' is empty, use your knowledge base to provide accurate company interview insights.
3. The sum of percentage values in "question_emphasis" MUST EQUAL EXACTLY 100%.
4. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or extra text.

JSON Schema:
{
  "company": "string",
  "style": "2-3 sentence overview of the company's interview process and bar-raiser style",
  "focus_areas": ["string"],
  "question_emphasis": {
    "behavioral": 40,
    "technical": 40,
    "system_design_or_case": 10,
    "hr": 10
  },
  "red_flags": ["string"],
  "insider_tips": ["string"]
}"""

async def get_company_intel(company: str, role: str) -> dict:
    profiles = _load_profiles()
    
    # Case-insensitive lookup with fallback to "general" profile
    company_key = company.strip().lower()
    profile = profiles.get(company_key, profiles.get("general", {}))
    
    user_content = f"""Target Company: {company}
Target Role: {role}
Known Profile Context:
{json.dumps(profile, indent=2)}"""

    # Call LLM
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Company Intel JSON: {response}")

    return response
