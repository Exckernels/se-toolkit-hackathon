from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Idea, IdeaChatMessage, IdeaVersion
from app.schemas import (
    DeleteIdeaResponse,
    DeleteVersionResponse,
    IdeaChatMessageRead,
    IdeaCreate,
    IdeaRead,
    IdeaRefineRequest,
    IdeaVersionRead,
)
from app.services import (
    OpenRouterError,
    build_initial_prompt,
    build_refinement_prompt,
    create_chat_message,
    create_version_record,
    generate_structured_idea,
)

router = APIRouter(tags=["ideas"])


@router.post("/ideas", response_model=IdeaRead, status_code=status.HTTP_201_CREATED)
def create_idea(payload: IdeaCreate, db: Session = Depends(get_db)) -> Idea:
    idea = Idea(title=payload.title, raw_description=payload.raw_description)
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea


@router.get("/ideas", response_model=list[IdeaRead])
def list_ideas(db: Session = Depends(get_db)) -> list[Idea]:
    result = db.execute(select(Idea).order_by(desc(Idea.created_at)))
    return list(result.scalars().all())


@router.get("/ideas/{id}", response_model=IdeaRead)
def get_idea(id: int, db: Session = Depends(get_db)) -> Idea:
    idea = db.get(Idea, id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea


@router.delete("/ideas/{id}", response_model=DeleteIdeaResponse)
def delete_idea(id: int, db: Session = Depends(get_db)) -> DeleteIdeaResponse:
    idea = db.get(Idea, id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    db.delete(idea)
    db.commit()
    return DeleteIdeaResponse(id=id, message="Idea deleted")


@router.get("/ideas/{id}/versions", response_model=list[IdeaVersionRead])
def list_idea_versions(id: int, db: Session = Depends(get_db)) -> list[IdeaVersion]:
    idea = db.get(Idea, id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    result = db.execute(
        select(IdeaVersion)
        .where(IdeaVersion.idea_id == id)
        .order_by(desc(IdeaVersion.created_at))
    )
    return list(result.scalars().all())


@router.get("/ideas/{id}/messages", response_model=list[IdeaChatMessageRead])
def list_idea_messages(id: int, db: Session = Depends(get_db)) -> list[IdeaChatMessage]:
    idea = db.get(Idea, id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    result = db.execute(
        select(IdeaChatMessage)
        .where(IdeaChatMessage.idea_id == id)
        .order_by(IdeaChatMessage.created_at.asc())
    )
    return list(result.scalars().all())


@router.delete("/versions/{id}", response_model=DeleteVersionResponse)
def delete_version(id: int, db: Session = Depends(get_db)) -> DeleteVersionResponse:
    version = db.get(IdeaVersion, id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    db.delete(version)
    db.commit()
    return DeleteVersionResponse(id=id, message="Version deleted")


@router.post("/ideas/{id}/generate", response_model=IdeaVersionRead, status_code=status.HTTP_201_CREATED)
async def generate_idea_version(id: int, db: Session = Depends(get_db)) -> IdeaVersion:
    idea = db.get(Idea, id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    prompt = build_initial_prompt(idea)

    try:
        data = await generate_structured_idea(prompt)
    except OpenRouterError as error:
        raise HTTPException(status_code=500, detail=error.payload) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "details": str(error),
            },
        ) from error

    return create_version_record(db, idea, data)


@router.post("/ideas/{id}/refine", response_model=IdeaVersionRead, status_code=status.HTTP_201_CREATED)
async def refine_idea_version(
    id: int, payload: IdeaRefineRequest, db: Session = Depends(get_db)
) -> IdeaVersion:
    idea = db.get(Idea, id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    latest_version = db.execute(
        select(IdeaVersion)
        .where(IdeaVersion.idea_id == id)
        .order_by(desc(IdeaVersion.created_at))
        .limit(1)
    ).scalar_one_or_none()

    if not latest_version:
        raise HTTPException(status_code=400, detail="Generate an initial version before refining")

    recent_messages = db.execute(
        select(IdeaChatMessage)
        .where(IdeaChatMessage.idea_id == id)
        .order_by(desc(IdeaChatMessage.created_at))
        .limit(8)
    ).scalars().all()
    recent_messages = list(reversed(recent_messages))

    prompt = build_refinement_prompt(idea, latest_version, payload.message, recent_messages)

    try:
        data = await generate_structured_idea(prompt)
    except OpenRouterError as error:
        raise HTTPException(status_code=500, detail=error.payload) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "details": str(error),
            },
        ) from error

    create_chat_message(db, idea.id, "user", payload.message)
    version = create_version_record(db, idea, data)
    create_chat_message(
        db,
        idea.id,
        "assistant",
        f"Created version {version.id} with updated MVP plan.",
    )
    return version
