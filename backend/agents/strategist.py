import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are an Interview Strategist Agent. Your job is to create a tailored interview plan with realistic technical and behavioral questions based on the candidate's target role, difficulty level, and resume analysis.

Return ONLY valid JSON with this exact schema:
{
  "total_questions": 5,
  "question_mix": {
    "technical": 2,
    "behavioral": 1,
    "project": 1,
    "hr": 1
  },
  "focus_topics": ["string"],
  "questions": [
    {
      "type": "technical",
      "topic": "System Design",
      "question": "How do you handle out-of-vocabulary words in a speech-to-text model?",
      "difficulty": "Medium"
    }
  ]
}

Rules:
1. Return ONLY valid JSON. Do NOT include markdown blocks.
2. Question count must match difficulty: Easy=3, Medium=5, Hard=7.
3. Tailor questions specifically to the candidate's target role and weak areas."""

async def create_plan(resume_analysis: dict, target_role: str, difficulty: str, language: str = "English") -> dict:
    count = {"Easy": 3, "Medium": 5, "Hard": 7}.get(difficulty, 5)
    user_content = f"""Target Role: {target_role}
Difficulty: {difficulty}
Required Question Count: {count}
Resume Analysis: {resume_analysis}"""
    
    response = await call_llm(SYSTEM_PROMPT, user_content)
    
    if isinstance(response, str):
        cleaned_response = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse JSON response from LLM: {response}")
            
    return response
