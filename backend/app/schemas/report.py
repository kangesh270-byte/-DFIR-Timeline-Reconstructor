from pydantic import BaseModel


class TimelineEvaluationRequest(BaseModel):
    scenarioId: str
    userPlacements: list[dict]
    relationships: list[dict]
    timeTakenSeconds: int = 300


class TimelineEvaluationResponse(BaseModel):
    reportId: str
    evaluation: dict


class ReportCreate(BaseModel):
    userId: str | None = None
    scenarioId: str | None = None
    scenarioTitle: str | None = None
    score: int = 0
    accuracyPercentage: float = 0.0
    starsEarned: int = 0
    narrative: str | None = None
    weaknesses: list[str] = []
    recommendations: list[str] = []


class ReportUpdate(BaseModel):
    userId: str | None = None
    scenarioId: str | None = None
    scenarioTitle: str | None = None
    score: int | None = None
    accuracyPercentage: float | None = None
    starsEarned: int | None = None
    narrative: str | None = None
    weaknesses: list[str] | None = None
    recommendations: list[str] | None = None


class ReportOut(BaseModel):
    id: str
    userId: str | None = None
    scenarioId: str | None = None
    scenarioTitle: str | None = None
    completedAt: str | None = None
    score: int = 0
    accuracyPercentage: float = 0.0
    starsEarned: int = 0
    userPlacements: list[dict] = []
    relationships: list[dict] = []
    narrative: str | None = None
    weaknesses: list[str] = []
    recommendations: list[str] = []
    evaluation: dict = {}
