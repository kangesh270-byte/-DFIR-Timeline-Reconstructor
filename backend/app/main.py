import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, evidence, health, leaderboard, reports, scenarios, timeline, users

logger = logging.getLogger("dfir")
logging.basicConfig(level=logging.INFO)

load_dotenv()
os.makedirs("backend/app", exist_ok=True)

app = FastAPI(title="DFIR Timeline Reconstructor API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://dfir-timeline-reconstructor-mojk-d3nefx2gp.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(scenarios.router)
app.include_router(evidence.router)
app.include_router(timeline.router)
app.include_router(reports.router)
app.include_router(leaderboard.router)
app.include_router(users.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "DFIR Timeline Reconstructor API"}
