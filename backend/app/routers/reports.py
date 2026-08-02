from fastapi import APIRouter, HTTPException

from ..schemas.report import (ReportCreate, ReportOut, ReportUpdate, TimelineEvaluationRequest,
                              TimelineEvaluationResponse)
from ..services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])
service = ReportService()


@router.post("/timeline/evaluate", response_model=TimelineEvaluationResponse)
async def evaluate_timeline(payload: TimelineEvaluationRequest) -> TimelineEvaluationResponse:
    try:
        result = await service.evaluate_timeline(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return TimelineEvaluationResponse(**result)


@router.post("", response_model=ReportOut)
async def create_report(payload: ReportCreate) -> ReportOut:
    try:
        return await service.create_report(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[ReportOut])
async def list_reports() -> list[ReportOut]:
    return await service.get_reports()


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(report_id: str) -> ReportOut:
    report = await service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.patch("/{report_id}", response_model=ReportOut)
async def update_report(report_id: str, payload: ReportUpdate) -> ReportOut:
    report = await service.update_report(report_id, payload)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/{report_id}")
async def delete_report(report_id: str) -> dict:
    deleted = await service.delete_report(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"deleted": True, "id": report_id}
