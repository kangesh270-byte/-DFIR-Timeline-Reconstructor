import logging
from typing import Any
from uuid import uuid4

from ..database.supabase import get_supabase_client
from ..schemas.scenario import ScenarioCreate, ScenarioUpdate

logger = logging.getLogger(__name__)


class ScenarioService:
    async def list_scenarios(self) -> list[dict[str, Any]]:
        try:
            client = await get_supabase_client()
            response = await client.table("scenarios").select("*").order("created_at", desc=False).execute()
            return [self._normalize_scenario(row) for row in (response.data or [])]
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'scenarios' is unavailable; returning empty list")
                return []
            logger.exception("Failed to fetch scenarios from Supabase")
            raise RuntimeError("Unable to load scenarios from Supabase") from exc

    async def get_scenario(self, scenario_id: str) -> dict[str, Any] | None:
        client = await get_supabase_client()

        scenario_query = client.table("scenarios").select("*").eq("id", scenario_id).limit(1)
        response = await scenario_query.execute()
        rows = response.data or []
        logger.info("get_scenario called with scenario_id=%s", scenario_id)
        logger.info("Scenario query URL: %s", scenario_query._build_url())
        logger.info("Scenario rows: %s", len(rows))
        if not rows:
            return None

        scenario = rows[0]

        evidence_rows: list[dict[str, Any]] = []
        try:
            evidence_query = client.table("evidence").select("*").eq("scenario_id", scenario_id)
            evidence_response = await evidence_query.execute()
            evidence_rows = evidence_response.data or []
            logger.info("Evidence query URL: %s", evidence_query._build_url())
            logger.info("Evidence rows: %s", len(evidence_rows))
            logger.info("Evidence data sample: %s", evidence_rows[:3])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Evidence table is unavailable for %s: %s", scenario_id, exc)
            else:
                logger.exception("Failed to fetch evidence for scenario %s", scenario_id)
                raise

        relationship_rows: list[dict[str, Any]] = []
        try:
            relationship_query = client.table("relationships").select("*").eq("scenario_id", scenario_id)
            relationship_response = await relationship_query.execute()
            relationship_rows = relationship_response.data or []
            logger.info("Relationship query URL: %s", relationship_query._build_url())
            logger.info("Relationship rows: %s", len(relationship_rows))
            logger.info("Relationship data sample: %s", relationship_rows[:3])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Relationships table is unavailable for %s: %s", scenario_id, exc)
            else:
                logger.exception("Failed to fetch relationships for scenario %s", scenario_id)
                raise

        timeline_rows: list[dict[str, Any]] = []
        try:
            timeline_query = client.table("timeline_events").select("*").eq("scenario_id", scenario_id)
            timeline_response = await timeline_query.execute()
            timeline_rows = timeline_response.data or []
            logger.info("Timeline query URL: %s", timeline_query._build_url())
            logger.info("Timeline rows: %s", len(timeline_rows))
            logger.info("Timeline data sample: %s", timeline_rows[:3])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Timeline events table is unavailable for %s: %s", scenario_id, exc)
            else:
                logger.exception("Failed to fetch timeline events for scenario %s", scenario_id)
                raise

        return {
            **self._normalize_scenario(scenario),
            "evidenceCards": [self._normalize_evidence(row) for row in evidence_rows],
            "referenceRelationships": [self._normalize_relationship(row) for row in relationship_rows],
            "timelineEvents": [self._normalize_timeline_event(row) for row in timeline_rows],
        }

    def _normalize_relationship(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "sourceId": row.get("source_id"),
            "targetId": row.get("target_id"),
            "type": row.get("type"),
        }

    async def create_scenario(self, payload: ScenarioCreate) -> dict[str, Any]:
        client = await get_supabase_client()
        row = {
            "id": str(uuid4()),
            "title": payload.title,
            "description": payload.description,
            "difficulty": payload.difficulty,
            "category": payload.category,
            "target_host": payload.target_host,
            "threat_actor": payload.threat_actor,
            "time_window": payload.time_window,
            "narrative": payload.narrative,
        }
        response = await client.table("scenarios").insert(row).execute()
        rows = response.data or []
        if not rows:
            raise RuntimeError("Scenario creation returned no row")
        return self._normalize_scenario(rows[0])

    async def update_scenario(self, scenario_id: str, payload: ScenarioUpdate) -> dict[str, Any] | None:
        client = await get_supabase_client()
        update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if not update_data:
            return await self.get_scenario(scenario_id)
        response = await client.table("scenarios").update(update_data).eq("id", scenario_id).execute()
        rows = response.data or []
        if not rows:
            return None
        return self._normalize_scenario(rows[0])

    async def delete_scenario(self, scenario_id: str) -> bool:
        client = await get_supabase_client()
        response = await client.table("scenarios").delete().eq("id", scenario_id).execute()
        return bool(response.data or [])

    def _is_missing_table_error(self, exc: Exception) -> bool:
        message = str(exc)
        return "PGRST205" in message or "Could not find the table" in message or "404" in message

    def _normalize_scenario(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "title": row.get("title"),
            "difficulty": row.get("difficulty"),
            "category": row.get("category"),
            "description": row.get("description"),
            "targetHost": row.get("target_host"),
            "threatActor": row.get("threat_actor"),
            "evidenceCount": row.get("evidence_count"),
            "timeWindow": row.get("time_window"),
            "narrative": row.get("narrative"),
            "recommendations": row.get("recommendations") or [],
            "evidenceCards": [],
            "referenceRelationships": [],
        }

    def _normalize_evidence(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "scenarioId": row.get("scenario_id"),
            "title": row.get("title"),
            "timestamp": row.get("event_time"),
            "category": row.get("evidence_type"),
            "severity": row.get("severity"),
            "source": row.get("source"),
            "description": row.get("description"),
            "host": row.get("ip_address"),
            "user": row.get("username"),
            "processName": row.get("process_name"),
            "fileName": row.get("file_name"),
            "fileHash": row.get("file_hash"),
            "registryKey": row.get("registry_key"),
            "rawLog": row.get("raw_log"),
            "hint": row.get("hint"),
            "correctMitreTechniques": row.get("correct_mitre_techniques") or [],
            "correctKillChain": row.get("correct_kill_chain"),
        }

    def _normalize_timeline_event(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "scenarioId": row.get("scenario_id"),
            "timestamp": row.get("event_time"),
            "title": row.get("title"),
            "description": row.get("description"),
            "mitreTactic": row.get("mitre_tactic"),
            "mitreTechnique": row.get("mitre_technique"),
            "attackStage": row.get("attack_stage"),
            "severity": row.get("severity"),
            "source": row.get("source"),
        }

    def _parse_technique_ids(self, value: Any) -> list[str]:
        if not value:
            return []
        if isinstance(value, list):
            return [str(item) for item in value if item is not None]
        if isinstance(value, str):
            return [item.strip() for item in value.split(',') if item.strip()]
        return [str(value)]
