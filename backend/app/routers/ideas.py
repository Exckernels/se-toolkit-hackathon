from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Idea, IdeaVersion
from app.schemas import DeleteVersionResponse, IdeaCreate, IdeaRead, IdeaVersionRead
from app.services import OpenRouterError, generate_structured_idea

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

    prompt = f"{idea.title}. {idea.raw_description}"

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

    version = IdeaVersion(
        idea_id=idea.id,
        overview=str(data.get("overview", "")),
        audience=str(data.get("audience", "")),
        problem=str(data.get("problem", "")),
        solution=str(data.get("solution", "")),
        features_json=data.get("features", []),
        mvp_scope=str(data.get("mvp_scope", "")),
        risks_json=data.get("risks", []),
        roadmap_json=data.get("roadmap", []),
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version
