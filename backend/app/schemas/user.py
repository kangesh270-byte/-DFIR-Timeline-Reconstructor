from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    username: str | None = None
    full_name: str | None = None
    title: str | None = None
    xp: int = 0
    level: int = 1
    labs_completed: int = 0
    average_accuracy: float = 0.0
    total_time_spent_minutes: int = 0
    is_active: bool = True
    password_hash: str | None = None


class UserUpdate(BaseModel):
    email: str | None = None
    username: str | None = None
    full_name: str | None = None
    title: str | None = None
    xp: int | None = None
    level: int | None = None
    labs_completed: int | None = None
    average_accuracy: float | None = None
    total_time_spent_minutes: int | None = None
    is_active: bool | None = None
    password_hash: str | None = None


class UserOut(BaseModel):
    id: str
    email: str
    username: str | None = None
    full_name: str | None = None
    title: str | None = None
    xp: int = 0
    level: int = 1
    labs_completed: int = 0
    average_accuracy: float = 0.0
    total_time_spent_minutes: int = 0
    is_active: bool = True
