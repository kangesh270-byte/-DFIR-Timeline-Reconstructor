from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    full_name: str | None = None
    title: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    full_name: str | None = None
    title: str | None = None
    xp: int
    level: int
    labs_completed: int
    average_accuracy: float
    total_time_spent_minutes: int
