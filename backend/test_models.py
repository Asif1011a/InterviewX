import os
from openai import OpenAI
from dotenv import dotenv_values

vals = dotenv_values('.env')
c = OpenAI(api_key=vals['OPENROUTER_API_KEY'], base_url='https://openrouter.ai/api/v1')

models = [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-20b:free',
    'nvidia/nemotron-nano-9b-v2:free',
]

for m in models:
    try:
        r = c.chat.completions.create(
            model=m,
            messages=[{'role': 'user', 'content': 'say ok'}],
            max_tokens=5
        )
        print(f"OK: {m} -> {r.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"FAIL: {m} -> {str(e)[:120]}")
