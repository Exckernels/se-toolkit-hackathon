from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class IdeaCreate(BaseModel):
    title: str
    raw_description: str


class IdeaRead(BaseModel):
    id: int
    title: str
    raw_description: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IdeaVersionRead(BaseModel):
    id: int
    idea_id: int
    overview: str
    audience: str
    problem: str
    solution: str
    features_json: list[dict[str, Any]]
    mvp_scope: str
    risks_json: list[dict[str, Any]]
    roadmap_json: list[dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeleteVersionResponse(BaseModel):
    id: int
    message: str


class DeleteIdeaResponse(BaseModel):
    id: int
    message: str


class IdeaRefineRequest(BaseModel):
    message: str


class IdeaChatMessageRead(BaseModel):
    id: int
    idea_id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
