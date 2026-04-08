import json
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.config import get_openrouter_api_key
from app.models import Idea, IdeaChatMessage, IdeaVersion

FALLBACK_TEXT = "No data generated."


class OpenRouterError(Exception):
    def __init__(self, payload: dict[str, Any], status_code: int = 500) -> None:
        super().__init__(payload.get("error", "OpenRouter request failed"))
        self.payload = payload
        self.status_code = status_code


def parse_model_content(content: str) -> tuple[dict[str, Any] | None, str]:
    cleaned_content = content.replace("```json", "", 1).replace("```", "").strip()

    try:
        parsed = json.loads(cleaned_content)
    except json.JSONDecodeError:
        start = cleaned_content.find("{")
        end = cleaned_content.rfind("}")

        if start != -1 and end != -1 and end > start:
            recovered_content = cleaned_content[start : end + 1]
            try:
                parsed = json.loads(recovered_content)
            except json.JSONDecodeError:
                return None, content
        else:
            return None, content

    required_fields = ["overview", "audience", "problem", "solution"]
    if not all(parsed.get(field) for field in required_fields):
        return None, cleaned_content

    return parsed, cleaned_content


async def generate_structured_idea(idea: str) -> dict[str, Any]:
    api_key = get_openrouter_api_key()
    if not api_key:
        raise OpenRouterError({"error": "Missing OPENROUTER_API_KEY"})

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-4o-mini",
                "temperature": 0.2,
                "max_tokens": 900,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a product strategist.
Return ONLY raw valid JSON.
Do not use markdown.
Do not wrap in code fences.
Do not add explanations.
Return this exact structure:
{
  "overview": "...",
  "audience": "...",
  "problem": "...",
  "solution": "...",
  "features": [{"name": "...", "description": "..."}],
  "mvp_scope": "...",
  "risks": [{"type": "...", "description": "..."}],
  "roadmap": [{"week": 1, "goal": "..."}]
}""",
                    },
                    {
                        "role": "user",
                        "content": idea,
                    },
                ],
            },
        )

    text = response.text

    if response.status_code >= 400:
        raise OpenRouterError(
            {
                "error": "OpenRouter request failed",
                "status": response.status_code,
                "raw": text,
            }
        )

    try:
        provider_json = json.loads(text)
    except json.JSONDecodeError as exc:
        raise OpenRouterError(
            {
                "error": "OpenRouter returned invalid JSON",
                "raw": text,
            }
        ) from exc

    content = provider_json.get("choices", [{}])[0].get("message", {}).get("content")

    if not content:
        raise OpenRouterError(
            {
                "error": "No content returned from model",
                "raw": provider_json,
            }
        )

    parsed, raw_content = parse_model_content(content)

    if not parsed:
        raise OpenRouterError(
            {
                "error": "Model returned non-JSON or incomplete content",
                "raw": raw_content,
            }
        )

    return parsed


def normalize_structured_output(data: dict[str, Any] | None) -> dict[str, Any]:
    payload = data or {}

    return {
        "overview": str(payload.get("overview") or FALLBACK_TEXT),
        "audience": str(payload.get("audience") or FALLBACK_TEXT),
        "problem": str(payload.get("problem") or FALLBACK_TEXT),
        "solution": str(payload.get("solution") or FALLBACK_TEXT),
        "features": payload.get("features") if isinstance(payload.get("features"), list) else [],
        "mvp_scope": str(payload.get("mvp_scope") or FALLBACK_TEXT),
        "risks": payload.get("risks") if isinstance(payload.get("risks"), list) else [],
        "roadmap": payload.get("roadmap") if isinstance(payload.get("roadmap"), list) else [],
    }


def build_initial_prompt(idea: Idea) -> str:
    return f"{idea.title}. {idea.raw_description}"


def build_refinement_prompt(
    idea: Idea,
    latest_version: IdeaVersion,
    message: str,
    recent_messages: list[IdeaChatMessage],
) -> str:
    recent_context = "\n".join(
        f"{chat_message.role}: {chat_message.content}" for chat_message in recent_messages
    )

    return f"""Original idea title:
{idea.title}

Original idea description:
{idea.raw_description}

Latest structured version:
{json.dumps(
        {
            "overview": latest_version.overview,
            "audience": latest_version.audience,
            "problem": latest_version.problem,
            "solution": latest_version.solution,
            "features": latest_version.features_json,
            "mvp_scope": latest_version.mvp_scope,
            "risks": latest_version.risks_json,
            "roadmap": latest_version.roadmap_json,
        },
        ensure_ascii=False,
    )}

Recent refinement messages:
{recent_context or "No previous refinement messages."}

Refinement instruction:
{message}

Update the structured version to follow the refinement instruction while staying realistic and coherent."""


def create_version_record(db: Session, idea: Idea, data: dict[str, Any]) -> IdeaVersion:
    normalized = normalize_structured_output(data)

    version = IdeaVersion(
        idea_id=idea.id,
        overview=normalized["overview"],
        audience=normalized["audience"],
        problem=normalized["problem"],
        solution=normalized["solution"],
        features_json=normalized["features"],
        mvp_scope=normalized["mvp_scope"],
        risks_json=normalized["risks"],
        roadmap_json=normalized["roadmap"],
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def create_chat_message(db: Session, idea_id: int, role: str, content: str) -> IdeaChatMessage:
    message = IdeaChatMessage(idea_id=idea_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
