from pydantic import BaseModel, Field


class TimelineEventCreate(BaseModel):
    scenarioId: str | None = None
    eventTime: str | None = None
    title: str | None = None
    description: str | None = None
    mitreTactic: str | None = None
    mitreTechnique: str | None = None
    attackStage: str | None = None
    severity: str | None = None
    source: str | None = None


class TimelineEventUpdate(BaseModel):
    scenarioId: str | None = None
    eventTime: str | None = None
    title: str | None = None
    description: str | None = None
    mitreTactic: str | None = None
    mitreTechnique: str | None = None
    attackStage: str | None = None
    severity: str | None = None
    source: str | None = None


class TimelineEventOut(BaseModel):
    id: str
    scenarioId: str | None = None
    eventTime: str | None = None
    title: str | None = None
    description: str | None = None
    mitreTactic: str | None = None
    mitreTechnique: str | None = None
    attackStage: str | None = None
    severity: str | None = None
    source: str | None = None
