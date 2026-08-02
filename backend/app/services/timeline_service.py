import logging
from typing import Any
from uuid import uuid4

from ..database.supabase import get_supabase_client
from ..schemas.timeline import TimelineEventCreate, TimelineEventUpdate

logger = logging.getLogger(__name__)


class TimelineService:
    async def list_events(self, report_id: str | None = None, scenario_id: str | None = None) -> list[dict[str, Any]]:
        try:
            client = await get_supabase_client()
            query = client.table("timeline_events").select("*")
            if scenario_id:
                query = query.eq("scenario_id", scenario_id)
            response = await query.order("event_time", desc=False).execute()
            items = [self._normalize(row) for row in (response.data or [])]
            return items
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'timeline_events' is unavailable; returning empty list")
                return []
            logger.exception("Failed to fetch timeline events from Supabase")
            raise RuntimeError("Unable to load timeline events from Supabase") from exc

    async def get_event(self, event_id: str) -> dict[str, Any] | None:
        try:
            client = await get_supabase_client()
            response = await client.table("timeline_events").select("*").eq("id", event_id).limit(1).execute()
            rows = response.data or []
            return self._normalize(rows[0]) if rows else None
        except Exception as exc:
            logger.exception("Failed to fetch timeline event %s from Supabase", event_id)
            raise RuntimeError("Unable to load timeline event from Supabase") from exc

    async def create_event(self, payload: TimelineEventCreate) -> dict[str, Any]:
        try:
            client = await get_supabase_client()
            row = {
                "id": str(uuid4()),
                "scenario_id": payload.scenarioId,
                "event_time": payload.eventTime,
                "title": payload.title,
                "description": payload.description,
                "mitre_tactic": payload.mitreTactic,
                "mitre_technique": payload.mitreTechnique,
                "attack_stage": payload.attackStage,
                "severity": payload.severity,
                "source": payload.source,
            }
            response = await client.table("timeline_events").insert(row).execute()
            rows = response.data or []
            if not rows:
                raise RuntimeError("Timeline event creation returned no row")
            return self._normalize(rows[0])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'timeline_events' is unavailable for create")
                raise RuntimeError("Unable to create timeline event in Supabase") from exc
            logger.exception("Failed to create timeline event in Supabase")
            raise RuntimeError("Unable to create timeline event in Supabase") from exc

    async def update_event(self, event_id: str, payload: TimelineEventUpdate) -> dict[str, Any] | None:
        try:
            client = await get_supabase_client()
            update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
            if not update_data:
                return await self.get_event(event_id)
            serializable = self._serialize(update_data)
            response = await client.table("timeline_events").update(serializable).eq("id", event_id).execute()
            rows = response.data or []
            return self._normalize(rows[0]) if rows else None
        except Exception as exc:
            logger.exception("Failed to update timeline event %s in Supabase", event_id)
            raise RuntimeError("Unable to update timeline event in Supabase") from exc

    async def delete_event(self, event_id: str) -> bool:
        try:
            client = await get_supabase_client()
            response = await client.table("timeline_events").delete().eq("id", event_id).execute()
            return bool(response.data or [])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'timeline_events' is unavailable for delete %s", event_id)
                return False
            logger.exception("Failed to delete timeline event %s from Supabase", event_id)
            raise RuntimeError("Unable to delete timeline event from Supabase") from exc

    def _normalize(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "scenarioId": row.get("scenario_id"),
            "eventTime": row.get("event_time"),
            "title": row.get("title"),
            "description": row.get("description"),
            "mitreTactic": row.get("mitre_tactic"),
            "mitreTechnique": row.get("mitre_technique"),
            "attackStage": row.get("attack_stage"),
            "severity": row.get("severity"),
            "source": row.get("source"),
        }

    def _serialize(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            k: v for k, v in {
                "scenario_id": payload.get("scenarioId"),
                "event_time": payload.get("eventTime"),
                "title": payload.get("title"),
                "description": payload.get("description"),
                "mitre_tactic": payload.get("mitreTactic"),
                "mitre_technique": payload.get("mitreTechnique"),
                "attack_stage": payload.get("attackStage"),
                "severity": payload.get("severity"),
                "source": payload.get("source"),
            }.items() if v is not None
        }

    def _is_missing_table_error(self, exc: Exception) -> bool:
        message = str(exc)
        return "PGRST205" in message or "Could not find the table" in message or "404" in message
