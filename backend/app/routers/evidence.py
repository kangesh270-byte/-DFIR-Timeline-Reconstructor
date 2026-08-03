from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..database.supabase import get_supabase_client
from ..schemas.evidence import EvidenceCreate, EvidenceOut, EvidenceUpdate, EvidenceUploadRequest
from ..services.evidence_service import EvidenceService

router = APIRouter(prefix="/evidence", tags=["evidence"])
service = EvidenceService()


async def resolve_scenario_uuid(scenario_id: str | None) -> str:
    if not scenario_id:
        raise HTTPException(status_code=400, detail="scenario_id is required.")

    value = str(scenario_id).strip()
    try:
        UUID(value)
        return value
    except ValueError:
        pass

    client = await get_supabase_client()
    response = await client.table("scenarios").select("id,title").execute()
    rows = response.data or []
    match = next(
        (
            row
            for row in rows
            if str(row.get("title") or "").strip().lower() == value.lower()
        ),
        None,
    )

    if match is None or not match.get("id"):
        raise HTTPException(status_code=400, detail=f"Unknown scenario_id or scenario name: {scenario_id}")

    return str(match["id"])


def infer_evidence_type(source: str) -> str:
    """Infer evidence_type from source field."""
    source_lower = source.lower()
    
    if 'security.evtx' in source_lower or 'security' in source_lower and 'event' in source_lower:
        return 'Windows Event'
    elif 'sysmon' in source_lower:
        return 'Sysmon'
    elif 'powershell' in source_lower or 'microsoft-windows-powershell' in source_lower:
        return 'PowerShell'
    elif 'firewall' in source_lower:
        return 'Firewall'
    elif 'defender' in source_lower or 'microsoft defender' in source_lower:
        return 'Defender'
    else:
        return 'General'



@router.get("", response_model=list[EvidenceOut], status_code=status.HTTP_200_OK)
async def list_evidence(scenario_id: str | None = None) -> list[EvidenceOut]:
    return await service.list_evidence(scenario_id)


@router.get("/scenario/{scenario_id}", response_model=list[EvidenceOut], status_code=status.HTTP_200_OK)
async def list_evidence_by_scenario(scenario_id: str) -> list[EvidenceOut]:
    return await service.list_evidence(scenario_id)


@router.get("/{evidence_id}", response_model=EvidenceOut, status_code=status.HTTP_200_OK)
async def get_evidence(evidence_id: str) -> EvidenceOut:
    evidence = await service.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence


@router.post("", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED)
async def create_evidence(payload: EvidenceCreate) -> EvidenceOut:
    try:
        return await service.create_evidence(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    payload: dict[str, object] | list[dict[str, object]] | None = None,
    scenario_id: str | None = None,
) -> dict[str, object]:
    print("******** JSON UPLOAD ENDPOINT HIT ********")
    print("Payload Type:", type(payload))
    print("Payload:", payload)

    resolved_scenario_id = await resolve_scenario_uuid(scenario_id)
    print("Scenario Name:", scenario_id)
    print("Scenario UUID:", resolved_scenario_id)

    if isinstance(payload, dict) and 'records' in payload and isinstance(payload['records'], list):
        raw_records = payload['records']
    elif isinstance(payload, list):
        raw_records = payload
    else:
        raise HTTPException(status_code=422, detail="Request body must be a JSON array or an object with a 'records' array.")

    print("Records received:", len(raw_records))

    if not raw_records:
        raise HTTPException(status_code=400, detail="No evidence records were provided.")

    created_records: list[dict[str, object]] = []
    try:
        for record in raw_records:
            if not isinstance(record, dict):
                print("Validation Error:", record)
                raise ValueError(f"Invalid record payload: {record}")

            required_fields = ['timestamp', 'title', 'description', 'severity', 'source']
            missing = [field for field in required_fields if field not in record or record[field] is None or str(record[field]).strip() == '']
            if missing:
                print("Validation Error:", record)
                raise ValueError(f"Missing required field(s): {', '.join(missing)}")

            normalized = {
                **record,
                'scenarioId': resolved_scenario_id,
                'title': str(record['title']).strip(),
                'timestamp': str(record['timestamp']).strip(),
                'description': str(record['description']).strip(),
                'severity': str(record['severity']).strip(),
                'source': str(record['source']).strip(),
            }
            created = await service.create_evidence(EvidenceCreate(**normalized))
            created_records.append(created)
    except ValueError as exc:
        print("Validation Error:", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save evidence records: {str(exc)}") from exc

    return {
        "success": True,
        "fileType": "json",
        "recordsFound": len(raw_records),
        "recordsCreated": len(created_records),
        "records": created_records,
    }


@router.patch("/{evidence_id}", response_model=EvidenceOut, status_code=status.HTTP_200_OK)
async def update_evidence(evidence_id: str, payload: EvidenceUpdate) -> EvidenceOut:
    evidence = await service.update_evidence(evidence_id, payload)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evidence(evidence_id: str) -> None:
    deleted = await service.delete_evidence(evidence_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evidence not found")
