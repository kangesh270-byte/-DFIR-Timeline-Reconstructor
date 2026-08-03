from typing import Any
from pydantic import BaseModel, Field


class EvidenceCreate(BaseModel):
    scenarioId: str
    title: str
    timestamp: str | None = None
    trueTimestampMs: int | None = None
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
    correctMitreTechniques: list[dict[str, Any]] | None = None
    correctKillChain: str | None = None


class EvidenceUploadRequest(BaseModel):
    records: list[EvidenceCreate]


class EvidenceUpdate(BaseModel):
    scenarioId: str | None = None
    title: str | None = None
    timestamp: str | None = None
    trueTimestampMs: int | None = None
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
    correctMitreTechniques: list[dict[str, Any]] | None = None
    correctKillChain: str | None = None


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
