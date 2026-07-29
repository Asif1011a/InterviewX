import json
import re
from .base import call_llm

SYSTEM_PROMPT = """You are a Confidence Lens Agent. Your job is to analyze interview answers for non-assertive tone, hedging language, passive voice, and lack of specificity.

Rules:
1. Extract exact hedging words/phrases used in the text (e.g., "I guess", "maybe", "I think", "kind of", "sort of", "probably", "I feel like").
2. Count the number of passive voice construction signals.
3. Assess 'confidence_score' (1-10) and 'specificity_score' (1-10).
4. 'confidence_level' MUST be strictly one of: ["low", "moderate", "high"].
5. 'is_too_vague' should be true if the candidate speaks in generalizations without real actions/tools.
6. Return ONLY valid JSON matching the schema below. Do NOT use markdown code blocks (e.g., ```json) or extra text.

JSON Schema:
{
  "confidence_score": 7,
  "specificity_score": 6,
  "confidence_level": "low | moderate | high",
  "hedging_words_found": ["string"],
  "passive_voice_signals": 2,
  "is_too_vague": false,
  "confidence_tips": ["string"]
}"""

async def analyze_confidence(answer: str) -> dict:
    # 1. Deterministic Python checks (instant & free)
    words = answer.strip().split()
    word_count = len(words)
    is_too_short = word_count < 30  # Flag answers under 30 words

    user_content = f"""Answer Word Count: {word_count}
Is Flagged Short: {is_too_short}

Candidate Answer:
{answer}"""

    # 2. Call LLM with low temperature for deterministic linguistic analysis
    response = await call_llm(SYSTEM_PROMPT, user_content, temperature=0.1)

    # 3. Defensive JSON Parsing
    if isinstance(response, str):
        cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", response).strip()
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Confidence Lens JSON: {response}")
    else:
        result = response

    # 4. Inject deterministic python metrics back into final dict
    result["answer_word_count"] = word_count
    result["is_too_short"] = is_too_short

    return result
