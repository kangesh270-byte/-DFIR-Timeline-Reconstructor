from .auth import router as auth_router
from .evidence import router as evidence_router
from .health import router as health_router
from .leaderboard import router as leaderboard_router
from .reports import router as reports_router
from .scenarios import router as scenarios_router
from .timeline import router as timeline_router
from .users import router as users_router

__all__ = [
    "auth_router",
    "evidence_router",
    "health_router",
    "leaderboard_router",
    "reports_router",
    "scenarios_router",
    "timeline_router",
    "users_router",
]
