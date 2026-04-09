import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers.generate import router as generate_router
from app.routers.ideas import router as ideas_router

app = FastAPI(title="Idea Incubator Backend", root_path=os.getenv("ROOT_PATH", ""))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(generate_router)
app.include_router(ideas_router)
