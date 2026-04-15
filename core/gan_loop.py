import asyncio
from typing import AsyncIterator
import json

from agents import claude_agent, openai_agent


async def run(prompt: str, num_rounds: int = 2) -> AsyncIterator[str]:
    """
    Event shapes:
      {"type": "round_start", "round": 0}
      {"type": "response", "round": 0, "model": "claude"|"gpt", "content": "...", "score": null, "missing": []}
      {"type": "response", "round": 1, "model": "claude"|"gpt", "content": "...", "score": 7, "missing": ["..."]}
      {"type": "synthesis", "content": "..."}
      {"type": "done"}
    """

    def emit(data: dict) -> str:
        return f"data: {json.dumps(data)}\n\n"

    # rounds stores raw content strings for passing to the next critique call
    rounds: list[dict] = []

    # ── Round 0: both models answer independently ─────────────────────────────
    yield emit({"type": "round_start", "round": 0})

    claude_resp, gpt_resp = await asyncio.gather(
        claude_agent.generate_initial(prompt),
        openai_agent.generate_initial(prompt),
    )

    rounds.append({"claude": claude_resp, "gpt": gpt_resp})
    yield emit({"type": "response", "round": 0, "model": "claude", "content": claude_resp, "score": None, "missing": []})
    yield emit({"type": "response", "round": 0, "model": "gpt",    "content": gpt_resp,   "score": None, "missing": []})

    # ── Critique rounds ───────────────────────────────────────────────────────
    for r in range(1, num_rounds + 1):
        yield emit({"type": "round_start", "round": r})

        prev = rounds[-1]
        claude_result, gpt_result = await asyncio.gather(
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

        # Store only the content strings for the next critique pass
        rounds.append({"claude": claude_result["response"], "gpt": gpt_result["response"]})

        yield emit({
            "type": "response", "round": r, "model": "claude",
            "content": claude_result["response"],
            "score": claude_result["score"],
            "missing": claude_result["missing"],
        })
        yield emit({
            "type": "response", "round": r, "model": "gpt",
            "content": gpt_result["response"],
            "score": gpt_result["score"],
            "missing": gpt_result["missing"],
        })

    # ── Final synthesis ───────────────────────────────────────────────────────
    final = rounds[-1]
    synthesis = await claude_agent.synthesize(
        original_prompt=prompt,
        claude_final=final["claude"],
        gpt_final=final["gpt"],
    )
    yield emit({"type": "synthesis", "content": synthesis})
    yield emit({"type": "done"})
