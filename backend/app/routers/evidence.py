import csv
import json

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ..schemas.evidence import EvidenceCreate, EvidenceOut, EvidenceUpdate
from ..services.evidence_service import EvidenceService

router = APIRouter(prefix="/evidence", tags=["evidence"])
service = EvidenceService()


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
async def upload_evidence(file: UploadFile = File(...), scenario_id: str | None = None) -> dict[str, object]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file must be uploaded.")

    if not scenario_id:
        raise HTTPException(status_code=400, detail="scenario_id is required.")

    extension = file.filename.split('.')[-1].lower()
    if extension not in {'csv', 'json'}:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and JSON are accepted.")

    content = await file.read()

    def validate_record(record: dict[str, object]) -> dict[str, object]:
        required_fields = ['timestamp', 'title', 'description', 'severity', 'source']
        parsed: dict[str, object] = {}

        for field in required_fields:
            if field not in record or record[field] is None or str(record[field]).strip() == '':
                raise ValueError(f"Missing required field: {field}")
            parsed[field] = str(record[field]).strip()

        optional_fields = ['user', 'host', 'processName', 'fileName', 'fileHash', 'registryKey']
        for field in optional_fields:
            if field in record and record[field] is not None and str(record[field]).strip() != '':
                parsed[field] = str(record[field]).strip()

        # Handle category: use provided value or infer from source
        if 'category' in record and record['category'] is not None and str(record['category']).strip() != '':
            parsed['category'] = str(record['category']).strip()
        else:
            # Infer evidence_type from source field to ensure it's never null
            parsed['category'] = infer_evidence_type(str(parsed['source']))

        return parsed

    records: list[dict[str, object]] = []
    if extension == 'csv':
        try:
            decoded = content.decode('utf-8-sig')
            rows = list(csv.DictReader(decoded.splitlines()))
            for row in rows:
                records.append(validate_record(row))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}") from exc
    else:
        try:
            payload = json.loads(content.decode('utf-8'))
            if isinstance(payload, list):
                for item in payload:
                    if not isinstance(item, dict):
                        raise ValueError('Each item in the JSON array must be an object.')
                    records.append(validate_record(item))
            elif isinstance(payload, dict):
                records.append(validate_record(payload))
            else:
                raise ValueError('JSON payload must be an object or array.')
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid JSON file: {exc}") from exc

    # Save records to database
    created_records: list[dict[str, object]] = []
    try:
        for record in records:
            payload = EvidenceCreate(
                scenarioId=scenario_id,
                title=record.get('title'),
                timestamp=record.get('timestamp'),
                description=record.get('description'),
                severity=record.get('severity'),
                source=record.get('source'),
                category=record.get('category'),
                user=record.get('user'),
                host=record.get('host'),
                processName=record.get('processName'),
                fileName=record.get('fileName'),
                fileHash=record.get('fileHash'),
                registryKey=record.get('registryKey'),
            )
            created = await service.create_evidence(payload)
            created_records.append(created)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save evidence records: {str(exc)}") from exc

    return {
        "success": True,
        "fileType": extension,
        "recordsFound": len(records),
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
