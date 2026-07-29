import os, json, re, asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
_client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)
MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

def _extract_json(raw: str) -> dict:
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"```\s*$", "", raw.strip())
    match = re.search(r"(\{.*\}|\[.*\])", raw, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return json.loads(raw.strip())

async def call_llm(system_prompt: str, user_content: str, temperature: float = 0.3) -> dict:
    last_error = None
    for attempt in range(3):
        try:
            response = await _client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": system_prompt + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation."},
                    {"role": "user", "content": user_content}
                ],
                temperature=temperature,
            )
            return _extract_json(response.choices[0].message.content)
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)
            continue
        except Exception as e:
            last_error = e
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)
            continue
    raise RuntimeError(f"LLM returned invalid JSON after 3 attempts: {last_error}")
