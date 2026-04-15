from pydantic import BaseModel
from typing import List, Optional


class GANRequest(BaseModel):
    prompt: str
    num_rounds: int = 2


class RoundResponse(BaseModel):
    round_num: int
    claude: str
    gpt: str


class GANResponse(BaseModel):
    prompt: str
    rounds: List[RoundResponse]
    synthesis: str
