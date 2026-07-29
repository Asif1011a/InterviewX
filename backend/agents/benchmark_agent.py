import json
import os
import re
from .base import call_llm

_BENCHMARKS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "role_benchmarks.json")

def _load_benchmarks() -> dict:
    try:
        with open(_BENCHMARKS_PATH, "r") as f:
            data = json.load(f)
            # Store top-level keys in lowercase for case-insensitive lookup
            return {k.lower(): v for k, v in data.items()}
    except Exception:
        return {}

SYSTEM_PROMPT = """You are a Benchmark Agent. Your job is to compare candidate performance analytics against industry standards for their specific role and experience level.

Rules:
1. Align 'badge' strictly with 'student_score':
   - Needs Work: student_score < 50
   - On Track: student_score between 50 and 69
   - Rising Star: student_score between 70 and 84
   - Top Performer: student_score >= 85
2. 'percentile' MUST be an integer between 1 and 99 reflecting comparative standing against peers at the same experience level.
3. 'badge' MUST be strictly one of: ["Needs Work", "On Track", "Rising Star", "Top Performer"].
4. Ensure 'expected_score' matches the baseline benchmark provided or logical role default.
5. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or extra text.

JSON Schema:
{
  "level": "string",
  "expected_score": 65,
  "student_score": 72,
  "percentile": 68,
  "verdict": "string summarizing comparative performance",
  "comparison": "string explaining how the candidate compares to peers",
  "next_milestone": "string detailing action required to reach the next tier",
  "badge": "Needs Work | On Track | Rising Star | Top Performer"
}"""

async def benchmark_performance(analytics: dict, role: str, experience_level: str) -> dict:
    benchmarks = _load_benchmarks()
    
    # 1. Case-insensitive role lookup with fallback to software engineer
    role_key = role.strip().lower() if role else "software engineer"
    role_bench = benchmarks.get(role_key, benchmarks.get("software engineer", {}))
    
    # 2. Case-insensitive experience level lookup
    level_key = experience_level.strip().lower() if experience_level else "fresher"
    
    level_data = {}
    for k, v in role_bench.items():
        if k.lower() == level_key:
            level_data = v
            break
            
    if not level_data:
        # Fallback to 'Fresher' or first available entry
        level_data = role_bench.get("Fresher", role_bench.get("fresher", {}))

    student_score = analytics.get("readiness_score", 0)

    user_content = f"""Target Role: {role}
Experience Level: {experience_level}
Student Readiness Score: {student_score}
Weak Topics: {analytics.get('weak_topics', [])}
Strong Topics: {analytics.get('strong_topics', [])}

Baseline Benchmarks:
Expected Baseline Score: {level_data.get('expected_score', 65)}
Role Key Skills: {level_data.get('key_skills', [])}"""

    # 3. Call LLM with low temperature for consistent benchmarking
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.2)

    # 4. Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Benchmark Agent JSON response: {response}")

    return response
