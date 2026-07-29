import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Soft Skills Assessment Agent. Your job is to analyze interview transcripts for non-technical behavioral competencies that hiring managers evaluate.

Evaluation Dimensions (Scale 1 to 10):
- communication_score: Clarity, conciseness, articulation.
- leadership_score: Initiative, influence, decision-making.
- teamwork_score: Collaboration, empathy, conflict resolution.
- problem_solving_score: Analytical thinking, resourceful approach.
- adaptability_score: Resilience, learning agility, handling ambiguity.
- emotional_intelligence_score: Self-awareness, interpersonal sensitivity.
- cultural_fit_score: Alignment with the target company's values.

Rules:
1. Extract explicit quote triggers for positive signals and red flags.
2. Differentiate between 'I' (ownership) and 'We' (collaboration)—praise 'I' for actions taken and 'We' for team efforts.
3. 'overall_soft_skills' must be a weighted float average rounded to 1 decimal place.
4. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "communication_score": 7,
  "leadership_score": 5,
  "teamwork_score": 8,
  "problem_solving_score": 6,
  "adaptability_score": 7,
  "emotional_intelligence_score": 5,
  "cultural_fit_score": 7,
  "overall_soft_skills": 6.4,
  "leadership_signals_found": ["string"],
  "teamwork_signals_found": ["string"],
  "red_flags": ["string"],
  "standout_behaviors": ["string"],
  "soft_skill_tips": ["string"],
  "cultural_fit_notes": "string"
}"""

async def assess_soft_skills(answers: list, role: str, company: str = "General") -> dict:
    # Safely format up to 5 full Q&A pairs without arbitrary mid-sentence cutting
    formatted_qa = []
    for i, a in enumerate(answers[:5]):
        q_text = a.get('question', 'N/A')
        a_text = a.get('answer', 'N/A')
        formatted_qa.append(f"Q{i+1}: {q_text}\nA{i+1}: {a_text}")

    answers_text = "\n\n".join(formatted_qa)
    
    user_content = f"""Target Role: {role}
Target Company: {company}

Interview Transcript:
{answers_text}"""

    # Call LLM with low temperature
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.3)

    # Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Soft Skills Assessment JSON: {response}")

    return response
