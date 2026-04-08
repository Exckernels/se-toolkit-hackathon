from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas import GenerateRequest
from app.services import OpenRouterError, generate_structured_idea

router = APIRouter(tags=["generate"])


@router.post("/generate")
async def generate(payload: GenerateRequest):
    try:
        parsed = await generate_structured_idea(payload.idea)
        return JSONResponse(parsed)
    except OpenRouterError as error:
        return JSONResponse(error.payload, status_code=error.status_code)
    except Exception as error:
        return JSONResponse(
            {
                "error": "Internal server error",
                "details": str(error),
            },
            status_code=500,
        )
