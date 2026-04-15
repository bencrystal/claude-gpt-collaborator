from openai import AsyncOpenAI
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
) -> str:
    user_message = f"""Original prompt:
{original_prompt}

Your previous response:
{your_previous}

{other_name}'s response to the same prompt:
{other_previous}

Instructions:
1. Identify specific points, perspectives, or nuances that {other_name} captured that were absent or underdeveloped in your response.
2. Also note what you covered well that should be retained.
3. Produce an improved response that is more complete than either previous response — incorporating the best of both while adding any further depth you can.

Output only the improved response (no meta-commentary about the process)."""

    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a thorough, expert assistant engaged in a collaborative refinement process. "
                    "You will review another model's response, identify what it captured that you missed, "
                    "and produce a strictly better, more complete response."
                ),
            },
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content
