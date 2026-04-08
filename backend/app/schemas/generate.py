from pydantic import BaseModel


class GenerateRequest(BaseModel):
    idea: str
