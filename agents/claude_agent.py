import anthropic
import os

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

MODEL = "claude-opus-4-6"


async def generate(prompt: str) -> str:
    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )
    return next(b.text for b in response.content if b.type == "text")


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
) -> str:
    system = (
        "You are a thorough, expert assistant engaged in a collaborative refinement process. "
        "You will review another model's response, identify what it captured that you missed, "
        "and produce a strictly better, more complete response."
    )
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

    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    return next(b.text for b in response.content if b.type == "text")


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
