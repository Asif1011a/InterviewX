import os
from openai import OpenAI
from dotenv import dotenv_values

vals = dotenv_values('.env')
c = OpenAI(api_key=vals['GROQ_API_KEY'], base_url='https://api.groq.com/openai/v1')

try:
    r = c.chat.completions.create(
        model='llama-3.1-8b-instant',
        messages=[{'role': 'user', 'content': 'respond with valid json only: {"status": "ok"}'}],
        max_tokens=20
    )
    print("SUCCESS:", r.choices[0].message.content.strip())
except Exception as e:
    print("FAIL:", str(e))
