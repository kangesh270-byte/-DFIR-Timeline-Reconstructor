from fastapi import APIRouter, HTTPException, Path

from ..schemas.leaderboard import LeaderboardEntryCreate, LeaderboardEntryOut, LeaderboardEntryUpdate
from ..services.leaderboard_service import LeaderboardService

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])
service = LeaderboardService()


@router.get("", response_model=list[LeaderboardEntryOut])
async def list_leaderboard() -> list[LeaderboardEntryOut]:
    return await service.get_leaderboard()


@router.get("/{entry_id}", response_model=LeaderboardEntryOut)
async def get_leaderboard_entry(entry_id: str) -> LeaderboardEntryOut:
    entry = await service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Leaderboard entry not found")
    return entry


@router.get("/top/{limit}", response_model=list[LeaderboardEntryOut])
async def get_top_leaderboard(limit: int = Path(..., ge=1)) -> list[LeaderboardEntryOut]:
    return await service.get_top(limit)


@router.post("", response_model=LeaderboardEntryOut, status_code=201)
async def create_leaderboard_entry(payload: LeaderboardEntryCreate) -> LeaderboardEntryOut:
    try:
        return await service.create_entry(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{entry_id}", response_model=LeaderboardEntryOut)
async def update_leaderboard_entry(entry_id: str, payload: LeaderboardEntryUpdate) -> LeaderboardEntryOut:
    entry = await service.update_entry(entry_id, payload)
    if not entry:
        raise HTTPException(status_code=404, detail="Leaderboard entry not found")
    return entry


@router.delete("/{entry_id}", status_code=204)
async def delete_leaderboard_entry(entry_id: str) -> None:
    deleted = await service.delete_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Leaderboard entry not found")

