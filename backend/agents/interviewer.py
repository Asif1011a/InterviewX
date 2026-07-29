import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Senior Technical Interviewer Agent. Your job is to generate EXACTLY ONE sharp, conversational follow-up question based on the candidate's response.

Rules:
1. Base the follow-up strictly on what the candidate explicitly stated or left unsaid.
2. 'probe_type' MUST be strictly one of: ["depth", "clarification", "challenge", "extension"].
   - depth: Asks for technical specifics, concrete implementation details, or missing metrics.
   - clarification: Asks to clarify a vague, ambiguous, or incomplete statement.
   - challenge: Questions a trade-off, tech choice, or edge case.
   - extension: Asks how the solution handles scale, new constraints, or failure modes.
3. IF the candidate's answer is extremely brief or "I don't know", generate a diagnostic/simplified question to help them demonstrate basic knowledge.
4. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "followup_question": "string",
  "probe_type": "depth | clarification | challenge | extension",
  "reason": "1-sentence justification for choosing this specific follow-up"
}"""

async def generate_followup(question: str, answer: str, role: str) -> dict:
    user_content = f"""Target Role: {role}

Original Question: {question}

Candidate Answer:
{answer}"""

    # Call LLM with temperature=0.5 for dynamic, natural conversation flow
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.5)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Follow-Up Agent JSON response: {response}")

    return response
