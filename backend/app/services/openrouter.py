import json
from typing import Any

import httpx

from app.config import get_openrouter_api_key


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
