import csv
import json
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_evidence(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file must be uploaded.")

    extension = file.filename.split('.')[-1].lower()
    if extension not in {'csv', 'json'}:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and JSON are accepted.")

    content = await file.read()

    if extension == 'csv':
        try:
            decoded = content.decode('utf-8-sig')
            rows = list(csv.DictReader(decoded.splitlines()))
            records_found = len(rows)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}") from exc
    else:
        try:
            payload = json.loads(content.decode('utf-8'))
            if isinstance(payload, list):
                records_found = len(payload)
            elif isinstance(payload, dict):
                records_found = 1
            else:
                raise ValueError('JSON payload must be an object or array.')
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid JSON file: {exc}") from exc

    return {
        "success": True,
        "fileType": extension,
        "recordsFound": records_found,
    }
