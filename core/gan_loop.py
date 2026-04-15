import asyncio
from typing import AsyncIterator
import json

from agents import claude_agent, openai_agent


async def run(prompt: str, num_rounds: int = 2) -> AsyncIterator[str]:
    """
    Runs the GAN-style cross-critique loop and yields SSE-formatted JSON events.

    Event shapes:
      {"type": "round_start", "round": 0}
      {"type": "response", "round": 0, "model": "claude"|"gpt", "content": "..."}
      {"type": "synthesis", "content": "..."}
      {"type": "done"}
    """

    def emit(data: dict) -> str:
        return f"data: {json.dumps(data)}\n\n"

    rounds: list[dict] = []

    # ── Round 0: both models answer independently ─────────────────────────────
    yield emit({"type": "round_start", "round": 0})

    claude_resp, gpt_resp = await asyncio.gather(
        claude_agent.generate_initial(prompt),
        openai_agent.generate_initial(prompt),
    )

    rounds.append({"claude": claude_resp, "gpt": gpt_resp})
    yield emit({"type": "response", "round": 0, "model": "claude", "content": claude_resp})
    yield emit({"type": "response", "round": 0, "model": "gpt", "content": gpt_resp})

    # ── Critique rounds ───────────────────────────────────────────────────────
    for r in range(1, num_rounds + 1):
        yield emit({"type": "round_start", "round": r})

        prev = rounds[-1]
        claude_improved, gpt_improved = await asyncio.gather(
            claude_agent.generate_critique_and_improve(
                original_prompt=prompt,
                your_previous=prev["claude"],
                other_previous=prev["gpt"],
                other_name="GPT-4",
            ),
            openai_agent.generate_critique_and_improve(
                original_prompt=prompt,
                your_previous=prev["gpt"],
                other_previous=prev["claude"],
                other_name="Claude",
            ),
        )

        rounds.append({"claude": claude_improved, "gpt": gpt_improved})
        yield emit({"type": "response", "round": r, "model": "claude", "content": claude_improved})
        yield emit({"type": "response", "round": r, "model": "gpt", "content": gpt_improved})

    # ── Final synthesis ───────────────────────────────────────────────────────
    final = rounds[-1]
    synthesis = await claude_agent.synthesize(
        original_prompt=prompt,
        claude_final=final["claude"],
        gpt_final=final["gpt"],
    )
    yield emit({"type": "synthesis", "content": synthesis})
    yield emit({"type": "done"})
