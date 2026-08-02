from typing import Any

from pydantic import BaseModel, Field


class ScenarioCreate(BaseModel):
    title: str
    description: str | None = None
    difficulty: str | None = None
    category: str | None = None
    target_host: str | None = None
    threat_actor: str | None = None
    time_window: str | None = None
    narrative: str | None = None


class ScenarioUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty: str | None = None
    category: str | None = None
    target_host: str | None = None
    threat_actor: str | None = None
    time_window: str | None = None
    narrative: str | None = None


class RelationshipOut(BaseModel):
    id: str
    sourceId: str
    targetId: str
    type: str


class EvidenceOut(BaseModel):
    id: str
    scenarioId: str | None = None
    title: str | None = None
    timestamp: str | None = None
    category: str | None = None
    severity: str | None = None
    source: str | None = None
    description: str | None = None
    host: str | None = None
    user: str | None = None
    processName: str | None = None
    fileName: str | None = None
    fileHash: str | None = None
    registryKey: str | None = None
    rawLog: str | None = None
    hint: str | None = None
    correctMitreTechniques: list[dict[str, Any]] = Field(default_factory=list)
    correctKillChain: str | None = None


class RelationshipOut(BaseModel):
    id: str
    sourceId: str
    targetId: str
    type: str


class ScenarioOut(BaseModel):
    id: str
    title: str
    difficulty: str | None = None
    category: str | None = None
    description: str | None = None
    targetHost: str | None = None
    threatActor: str | None = None
    evidenceCount: int | None = None
    timeWindow: str | None = None
    narrative: str | None = None
    recommendations: list[str] = Field(default_factory=list)
    evidenceCards: list[EvidenceOut] = Field(default_factory=list)
    referenceRelationships: list[RelationshipOut] = Field(default_factory=list)
    timelineEvents: list[dict] = Field(default_factory=list)
