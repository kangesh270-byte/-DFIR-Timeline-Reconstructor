import logging
from typing import Any
from uuid import uuid4

from ..database.supabase import get_supabase_client
from ..schemas.evidence import EvidenceCreate, EvidenceUpdate

logger = logging.getLogger(__name__)


class EvidenceService:
    async def list_evidence(self, scenario_id: str | None = None) -> list[dict[str, Any]]:
        try:
            client = await get_supabase_client()
            query = client.table("evidence").select("*")
            if scenario_id:
                query = query.eq("scenario_id", scenario_id)
            response = await query.order("created_at", desc=False).execute()
            return [self._normalize(row) for row in (response.data or [])]
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'evidence' is unavailable; returning empty list")
                return []
            logger.exception("Failed to fetch evidence from Supabase")
            raise RuntimeError("Unable to load evidence from Supabase") from exc

    async def get_evidence(self, evidence_id: str) -> dict[str, Any] | None:
        try:
            client = await get_supabase_client()
            response = await client.table("evidence").select("*").eq("id", evidence_id).limit(1).execute()
            rows = response.data or []
            return self._normalize(rows[0]) if rows else None
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'evidence' is unavailable for %s", evidence_id)
                return None
            logger.exception("Failed to fetch evidence %s from Supabase", evidence_id)
            raise RuntimeError("Unable to load evidence details from Supabase") from exc

    async def create_evidence(self, payload: EvidenceCreate) -> dict[str, Any]:
        try:
            client = await get_supabase_client()
            row: dict[str, Any] = {
                "id": str(uuid4()),
                "scenario_id": payload.scenarioId,
                "title": payload.title,
            }

            evidence_type = "General"
            if payload.category is not None and str(payload.category).strip():
                evidence_type = str(payload.category).strip()
            else:
                source_value = str(payload.source or "").strip().lower()
                if "microsoft365" in source_value or "outlook" in source_value or "exchange" in source_value:
                    evidence_type = "Email"
                elif "sysmon" in source_value:
                    evidence_type = "Sysmon"
                elif "security" in source_value:
                    evidence_type = "Windows Event"
                elif "powershell" in source_value:
                    evidence_type = "PowerShell"
                elif "defender" in source_value:
                    evidence_type = "Defender"
                elif "firewall" in source_value:
                    evidence_type = "Firewall"
                elif "dns" in source_value:
                    evidence_type = "DNS"
                elif "proxy" in source_value:
                    evidence_type = "Proxy"

            row["evidence_type"] = evidence_type
            print("Evidence Type:", evidence_type)
            
            # Add optional fields only if they have values, mapping to actual column names
            if payload.timestamp is not None:
                row["event_time"] = payload.timestamp
            if payload.severity is not None:
                row["severity"] = payload.severity
            if payload.source is not None:
                row["source"] = payload.source
            if payload.description is not None:
                row["description"] = payload.description
            if payload.host is not None:
                row["ip_address"] = payload.host
            if payload.user is not None:
                row["username"] = payload.user
            if payload.processName is not None:
                row["process_name"] = payload.processName
            if payload.fileName is not None:
                row["file_name"] = payload.fileName
            if payload.fileHash is not None:
                row["file_hash"] = payload.fileHash
            if payload.registryKey is not None:
                row["registry_key"] = payload.registryKey
            
            print("\n========== EVIDENCE INSERT ==========")
            print(row)
            print("=====================================\n")
            
            try:
                response = await client.table("evidence").insert(row).execute()
            except Exception as exc:
                print("========== SUPABASE ERROR ==========")
                print(exc)
                print("Row attempted:")
                print(row)
                print("====================================")
                raise
            
            # Print complete response details
            print("\n========== INSERT RESPONSE ==========")
            print(f"response.data: {response.data}")
            if hasattr(response, 'status_code'):
                print(f"response.status_code: {response.status_code}")
            if hasattr(response, 'count'):
                print(f"response.count: {response.count}")
            print("====================================\n")
            
            # If response.data contains rows, return the first one
            rows = response.data or []
            if rows:
                return self._normalize(rows[0])
            
            # If response.data is empty, try to fetch the row by id
            print("Response.data is empty, fetching inserted row by id...")
            fetch_response = await client.table("evidence").select("*").eq("id", row["id"]).limit(1).execute()
            rows = fetch_response.data or []
            if rows:
                print("Successfully fetched record by id")
                return self._normalize(rows[0])
            
            # If fetch also fails, return the original inserted payload
            print("Could not fetch record by id, returning original payload")
            return self._normalize(row)
        except Exception as exc:
            logger.exception("Failed to create evidence in Supabase")

            print("\n========== FULL SUPABASE ERROR ==========")
            print("Exception Type:", type(exc))
            print("Exception:", str(exc))
            print("Repr:", repr(exc))

            if hasattr(exc, "args"):
                print("ARGS:", exc.args)

            print("=========================================\n")

            raise RuntimeError(str(exc))

    async def update_evidence(self, evidence_id: str, payload: EvidenceUpdate) -> dict[str, Any] | None:
        try:
            client = await get_supabase_client()
            update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
            if not update_data:
                return await self.get_evidence(evidence_id)
            serializable = self._serialize(update_data)
            response = await client.table("evidence").update(serializable).eq("id", evidence_id).execute()
            rows = response.data or []
            return self._normalize(rows[0]) if rows else None
        except Exception as exc:
            logger.exception("Failed to update evidence %s in Supabase", evidence_id)
            raise RuntimeError("Unable to update evidence in Supabase") from exc

    async def delete_evidence(self, evidence_id: str) -> bool:
        try:
            client = await get_supabase_client()
            response = await client.table("evidence").delete().eq("id", evidence_id).execute()
            return bool(response.data or [])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'evidence' is unavailable for delete %s", evidence_id)
                return False
            logger.exception("Failed to delete evidence %s from Supabase", evidence_id)
            raise RuntimeError("Unable to delete evidence from Supabase") from exc

    def _normalize(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "scenarioId": row.get("scenario_id"),
            "title": row.get("title"),
            "timestamp": row.get("event_time"),
            "trueTimestampMs": None,
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
            "rawLog": None,
            "hint": None,
            "correctMitreTechniques": [],
            "correctKillChain": None,
        }

    def _serialize(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            k: v for k, v in {
                "scenario_id": payload.get("scenarioId"),
                "title": payload.get("title"),
                "event_time": payload.get("timestamp"),
                "evidence_type": payload.get("category"),
                "severity": payload.get("severity"),
                "source": payload.get("source"),
                "description": payload.get("description"),
                "ip_address": payload.get("host"),
                "username": payload.get("user"),
                "process_name": payload.get("processName"),
                "file_name": payload.get("fileName"),
                "file_hash": payload.get("fileHash"),
                "registry_key": payload.get("registryKey"),
            }.items() if v is not None
        }

    def _is_missing_table_error(self, exc: Exception) -> bool:
        message = str(exc)
        return "PGRST205" in message or "Could not find the table" in message or "404" in message
