from dotenv import load_dotenv
load_dotenv()  # must run before any agent module is imported

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from core.gan_loop import run

app = FastAPI(title="LLM GAN")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    prompt: str
    num_rounds: int = 2


@app.post("/run")
async def run_gan(req: RunRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    if not (1 <= req.num_rounds <= 5):
        raise HTTPException(status_code=400, detail="num_rounds must be between 1 and 5")

    return StreamingResponse(
        run(req.prompt, req.num_rounds),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve the React build in production (when client/dist exists)
_dist = Path(__file__).parent / "client" / "dist"
if _dist.exists():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="spa")
