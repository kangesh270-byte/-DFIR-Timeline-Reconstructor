from pydantic import BaseModel, Field


class LeaderboardEntryCreate(BaseModel):
    username: str = Field(..., min_length=1)
    title: str | None = None
    xp: int = Field(default=0, ge=0)
    labs_completed: int = Field(default=0, ge=0)
    avg_accuracy: int | float = Field(default=0, ge=0)
    avatar: str | None = None


class LeaderboardEntryUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1)
    title: str | None = None
    xp: int | None = Field(default=None, ge=0)
    labs_completed: int | None = Field(default=None, ge=0)
    avg_accuracy: int | float | None = Field(default=None, ge=0)
    avatar: str | None = None


class LeaderboardEntryOut(BaseModel):
    id: str
    rank: int
    username: str
    title: str | None = None
    xp: int = 0
    labsCompleted: int = 0
    avgAccuracy: int | float = 0
    avatar: str | None = None
