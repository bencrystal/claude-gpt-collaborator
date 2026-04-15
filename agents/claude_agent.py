import anthropic
import json
import os

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

MODEL = "claude-opus-4-6"

_CRITIQUE_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {
            "type": "integer",
            "description": "Score out of 10 for how completely the other model's previous response answered the original prompt",
        },
        "missing": {
            "type": "array",
            "items": {"type": "string"},
            "description": "3-5 concise bullet points of specific things absent or underdeveloped in the other model's response",
        },
        "response": {
            "type": "string",
            "description": "Your improved response incorporating the best of both",
        },
    },
    "required": ["score", "missing", "response"],
    "additionalProperties": False,
}


async def generate_initial(prompt: str) -> str:
    system = (
        "You are a thorough, expert assistant. "
        "Respond to the prompt as completely and insightfully as possible."
    )
    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return next(b.text for b in response.content if b.type == "text")


async def generate_critique_and_improve(
    original_prompt: str,
    your_previous: str,
    other_previous: str,
    other_name: str,
) -> dict:
    """Returns {"score": int, "missing": [str], "response": str}"""
    system = (
        "You are a thorough, expert assistant engaged in a collaborative refinement process."
    )
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

Return a JSON object with keys: "score" (integer), "missing" (array of strings), "response" (string)."""

    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system,
        output_config={"format": {"type": "json_schema", "schema": _CRITIQUE_SCHEMA}},
        messages=[{"role": "user", "content": user_message}],
    )
    text = next(b.text for b in response.content if b.type == "text")
    return json.loads(text)


async def synthesize(
    original_prompt: str,
    claude_final: str,
    gpt_final: str,
) -> str:
    system = (
        "You are a master synthesizer. You will be given a prompt and two expert responses "
        "that have already been refined through multiple rounds of mutual critique. "
        "Your job is to produce the single best, most comprehensive answer by combining "
        "the strongest elements of both."
    )
    user_message = f"""Original prompt:
{original_prompt}

Claude's final response:
{claude_final}

GPT-4's final response:
{gpt_final}

Synthesize these into the single most complete, well-organized, and insightful response possible.
Output only the synthesized response."""

    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    return next(b.text for b in response.content if b.type == "text")
