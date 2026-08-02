from fastapi import APIRouter, HTTPException, status

from ..schemas.timeline import TimelineEventCreate, TimelineEventOut, TimelineEventUpdate
from ..services.timeline_service import TimelineService

router = APIRouter(prefix="/timeline", tags=["timeline"])
service = TimelineService()


@router.get("", response_model=list[TimelineEventOut], status_code=status.HTTP_200_OK)
async def list_events(report_id: str | None = None) -> list[TimelineEventOut]:
    return await service.list_events(report_id=report_id)


@router.get("/scenario/{scenario_id}", response_model=list[TimelineEventOut], status_code=status.HTTP_200_OK)
async def list_events_by_scenario(scenario_id: str) -> list[TimelineEventOut]:
    return await service.list_events(scenario_id=scenario_id)


@router.get("/{event_id}", response_model=TimelineEventOut, status_code=status.HTTP_200_OK)
async def get_event(event_id: str) -> TimelineEventOut:
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    return event


@router.post("", response_model=TimelineEventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: TimelineEventCreate) -> TimelineEventOut:
    try:
        return await service.create_event(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{event_id}", response_model=TimelineEventOut, status_code=status.HTTP_200_OK)
async def update_event(event_id: str, payload: TimelineEventUpdate) -> TimelineEventOut:
    event = await service.update_event(event_id, payload)
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: str) -> None:
    deleted = await service.delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Timeline event not found")
