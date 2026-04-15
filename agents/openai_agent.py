from openai import AsyncOpenAI
import json
import os

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MODEL = "gpt-4o"


async def generate_initial(prompt: str) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a thorough, expert assistant. "
                    "Respond to the prompt as completely and insightfully as possible."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content


async def generate_critique_and_improve(
    original_prompt: str,
    your_previous: str,
    other_previous: str,
    other_name: str,
) -> dict:
    """Returns {"score": int, "missing": [str], "response": str}"""
    user_message = f"""Original prompt:
{original_prompt}

Your previous response:
{your_previous}

{other_name}'s response to the same prompt:
{other_previous}

Instructions:
1. Score {other_name}'s response out of 10 for how completely it answers the original prompt.
2. List 3-5 specific things that were absent or underdeveloped in {other_name}'s response.
3. Produce an improved response that is more complete than either previous response.

Return a JSON object with exactly these keys:
- "score": integer 1-10
- "missing": array of 3-5 short strings
- "response": your full improved response as a string"""

    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=4096,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a thorough, expert assistant engaged in a collaborative refinement process. "
                    "Always respond with valid JSON containing 'score', 'missing', and 'response' keys."
                ),
            },
            {"role": "user", "content": user_message},
        ],
    )
    return json.loads(response.choices[0].message.content)
