import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Learning Path Agent. Your job is to convert identified candidate skill gaps into a structured, highly actionable 7-day study roadmap.

Rules:
1. Generate EXACTLY 7 days (Day 1 through Day 7).
2. Distribute the candidate's 'weak_topics' logically across the 7 days:
   - Early days: Core concepts and foundation practice.
   - Middle days: Advanced scenarios and edge cases.
   - Day 7: Comprehensive review and mock practice drill.
3. Use stable, reliable domain-level or search URLs (e.g., 'https://leetcode.com', 'https://www.hackerrank.com', 'https://docs.python.org') rather than inventing specific deep-link URLs that may 404.
4. 'total_hours' MUST strictly equal the sum of 'estimated_hours' across all 7 days.
5. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "priority_topic": "string",
  "total_hours": 14,
  "study_tip": "string providing practical study advice for this plan",
  "plan": [
    {
      "day": 1,
      "topic": "string",
      "focus": "string summarizing core learning objective",
      "tasks": ["string"],
      "resources": [
        {
          "title": "string",
          "url": "string (use high-level stable domain URLs)",
          "type": "article | video | practice | documentation"
        }
      ],
      "estimated_hours": 2
    }
  ]
}"""

async def generate_learning_path(weak_topics: list, role: str) -> dict:
    # Handle empty weak_topics fallback
    topics_list = weak_topics if weak_topics else ["Core Role Fundamentals", "Interview Answer Structuring"]
    
    user_content = f"""Target Role: {role}
Identified Weak Topics / Skill Gaps: {topics_list}"""

    # Call LLM with moderate temperature for actionable planning
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.4)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Learning Path JSON response: {response}")

    return response
