import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Practice Generator Agent. Your job is to create targeted, rapid-fire practice drills focused specifically on a candidate's identified weak topics.

Rules:
1. Generate EXACTLY 3 practice drills targeting the candidate's weakest gaps.
2. Calibrate drill difficulty using 'previous_scores':
   - Scores < 5/10: Set difficulty to 'Easy' to reinforce fundamental concepts.
   - Scores 5-7/10: Set difficulty to 'Medium'.
   - Scores 8+/10: Set difficulty to 'Hard' to test complex trade-offs or edge cases.
3. Keep questions short, actionable, and practical.
4. 'hint' must be a subtle one-line guiding tip without revealing the complete solution.
5. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "drills": [
    {
      "topic": "string",
      "question": "string",
      "hint": "string",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}"""

async def generate_drills(weak_topics: list, role: str, previous_scores: list = None) -> dict:
    # 1. Fallback handling for empty inputs
    topics = weak_topics if weak_topics else ["Core Problem Solving", "Answer Structuring (STAR)"]
    scores = previous_scores if previous_scores is not None else []

    user_content = f"""Target Role: {role}
Weak Topics to Target: {topics}
Previous Scores History: {scores}"""

    # 2. Call LLM with low-to-moderate temperature for balanced drill generation
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.3)

    # 3. Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Practice Generator JSON response: {response}")

    return response
