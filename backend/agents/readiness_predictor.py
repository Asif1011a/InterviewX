import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Readiness Predictor Agent. Your job is to analyze all candidate performance metrics, gap matrices, and benchmarks holistically to predict interview outcomes and readiness timelines.

Rules:
1. 'overall_readiness_score' must be an integer between 0 and 100 representing holistic offer readiness.
2. Align 'go_no_go' strictly with 'overall_readiness_score':
   - GO_NOW: Score >= 80
   - GO_WITH_PREP: Score between 50 and 79
   - NOT_YET: Score < 50
3. All 'pass_probability' values inside 'round_predictions' must be integers between 0 and 100.
4. Adapt 'predicted_salary_range' to match the market/currency of the target company or role (e.g., USD for US roles, INR for Indian roles, EUR for Europe).
5. 'days_to_interview_ready' must be a realistic non-negative integer.
6. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or commentary.

JSON Schema:
{
  "overall_readiness_score": 72,
  "go_no_go": "GO_NOW | GO_WITH_PREP | NOT_YET",
  "verdict": "string summarizing current standing and immediate recommendation",
  "days_to_interview_ready": 14,
  "round_predictions": {
    "hr_round": {"pass_probability": 85, "reasoning": "string"},
    "technical_round": {"pass_probability": 65, "reasoning": "string"},
    "system_design_or_case": {"pass_probability": 40, "reasoning": "string"}
  },
  "biggest_risk_factors": ["string"],
  "strongest_assets": ["string"],
  "priority_actions": [
    {
      "action": "string",
      "impact": "high | medium | low",
      "time_needed": "string"
    }
  ],
  "predicted_salary_range": "string"
}"""

async def predict_readiness(session_data: dict) -> dict:
    # 1. Prepare clean, non-truncated summaries of evaluations
    evals = session_data.get("evaluations", [])
    condensed_scores = []
    
    for e in evals[:6]:  # Limit to top 6 evaluations to preserve context window safely
        condensed_scores.append({
            "question": e.get("question", "")[:100],  # Clean string truncate on question text
            "topic": e.get("topic", "general"),
            "scores": e.get("evaluation", {})
        })

    target_role = session_data.get("target_role", "Software Engineer")
    company = session_data.get("company", "General")
    experience_level = session_data.get("experience_level", "Mid-Level")
    gaps = session_data.get("gap_matrix", {})
    benchmark = session_data.get("benchmark", {})

    user_content = f"""Target Role: {target_role}
Company: {company}
Experience Level: {experience_level}

Answer Evaluations Summary:
{json.dumps(condensed_scores, indent=2)}

Gap Matrix Summary:
{json.dumps(gaps, indent=2)}

Benchmark Context:
{json.dumps(benchmark, indent=2)}"""

    # 2. Call LLM with low temperature for consistent predictive evaluation
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # 3. Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Readiness Predictor JSON response: {response}")

    return response
