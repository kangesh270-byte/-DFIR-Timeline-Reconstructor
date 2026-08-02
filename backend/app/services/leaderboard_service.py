import logging
from typing import Any
from uuid import uuid4

from ..database.supabase import get_supabase_client
from ..schemas.leaderboard import LeaderboardEntryCreate, LeaderboardEntryUpdate

logger = logging.getLogger(__name__)


class LeaderboardService:
    async def get_leaderboard(self) -> list[dict[str, Any]]:
        try:
            client = await get_supabase_client()
            response = await client.table("leaderboard").select("*").execute()
            rows = response.data or []
            ranked_rows = sorted(rows, key=lambda row: (-int(row.get("xp") or 0), -(float(row.get("avg_accuracy") or 0)), str(row.get("username") or "")))
            return [self._normalize(row, index) for index, row in enumerate(ranked_rows, start=1)]
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'leaderboard' is unavailable; returning empty list")
                return []
            logger.exception("Failed to fetch leaderboard from Supabase")
            raise RuntimeError("Unable to load leaderboard from Supabase") from exc

    async def get_entry(self, entry_id: str) -> dict[str, Any] | None:
        try:
            client = await get_supabase_client()
            response = await client.table("leaderboard").select("*").eq("id", entry_id).limit(1).execute()
            rows = response.data or []
            if not rows:
                return None
            return self._normalize(rows[0], 1)
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'leaderboard' is unavailable for %s", entry_id)
                return None
            logger.exception("Failed to fetch leaderboard entry %s from Supabase", entry_id)
            raise RuntimeError("Unable to load leaderboard entry from Supabase") from exc

    async def get_top(self, limit: int) -> list[dict[str, Any]]:
        entries = await self.get_leaderboard()
        return entries[:limit]

    async def create_entry(self, payload: LeaderboardEntryCreate) -> dict[str, Any]:
        client = await get_supabase_client()
        row = {
            "id": str(uuid4()),
            "username": payload.username,
            "title": payload.title,
            "xp": payload.xp,
            "labs_completed": payload.labs_completed,
            "avg_accuracy": payload.avg_accuracy,
            "avatar": payload.avatar,
        }
        response = await client.table("leaderboard").insert(row).execute()
        rows = response.data or []
        if not rows:
            raise RuntimeError("Leaderboard creation returned no row")
        return self._normalize(rows[0], 1)

    async def update_entry(self, entry_id: str, payload: LeaderboardEntryUpdate) -> dict[str, Any] | None:
        client = await get_supabase_client()
        update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if not update_data:
            return await self.get_entry(entry_id)

        response = await client.table("leaderboard").update(update_data).eq("id", entry_id).execute()
        rows = response.data or []
        if not rows:
            return None
        return self._normalize(rows[0], 1)

    async def delete_entry(self, entry_id: str) -> bool:
        client = await get_supabase_client()
        response = await client.table("leaderboard").delete().eq("id", entry_id).execute()
        return bool(response.data or [])

    def _normalize(self, row: dict[str, Any], rank: int) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "rank": rank,
            "username": row.get("username"),
            "title": row.get("title"),
            "xp": row.get("xp"),
            "labsCompleted": row.get("labs_completed"),
            "avgAccuracy": row.get("avg_accuracy"),
            "avatar": row.get("avatar"),
        }

    def _is_missing_table_error(self, exc: Exception) -> bool:
        message = str(exc)
        return "PGRST205" in message or "Could not find the table" in message or "404" in message
