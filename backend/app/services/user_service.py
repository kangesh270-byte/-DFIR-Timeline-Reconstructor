from typing import Any
from uuid import uuid4

import jwt

from ..database.supabase import get_supabase_client
from ..schemas.user import UserCreate, UserUpdate

SECRET_KEY = "dev-secret-key"
ALGORITHM = "HS256"


class UserService:
    async def list_users(self) -> list[dict[str, Any]]:
        client = await get_supabase_client()
        response = await client.table("users").select("*").order("created_at", desc=False).execute()
        return [self._normalize(row) for row in (response.data or [])]

    async def get_user(self, user_id: str) -> dict[str, Any] | None:
        client = await get_supabase_client()
        response = await client.table("users").select("*").eq("id", user_id).limit(1).execute()
        rows = response.data or []
        if not rows:
            return None
        return self._normalize(rows[0])

    async def create_user(self, payload: UserCreate) -> dict[str, Any]:
        client = await get_supabase_client()
        row = {
            "id": str(uuid4()),
            "email": payload.email,
            "username": payload.username,
            "full_name": payload.full_name,
            "title": payload.title,
            "xp": payload.xp,
            "level": payload.level,
            "labs_completed": payload.labs_completed,
            "average_accuracy": payload.average_accuracy,
            "total_time_spent_minutes": payload.total_time_spent_minutes,
            "is_active": payload.is_active,
            "password_hash": payload.password_hash,
        }
        response = await client.table("users").insert(row).execute()
        rows = response.data or []
        if not rows:
            raise RuntimeError("User creation returned no row")
        return self._normalize(rows[0])

    async def update_user(self, user_id: str, payload: UserUpdate) -> dict[str, Any] | None:
        client = await get_supabase_client()
        update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if not update_data:
            return await self.get_user(user_id)
        response = await client.table("users").update(update_data).eq("id", user_id).execute()
        rows = response.data or []
        if not rows:
            return None
        return self._normalize(rows[0])

    async def delete_user(self, user_id: str) -> bool:
        client = await get_supabase_client()
        response = await client.table("users").delete().eq("id", user_id).execute()
        return bool(response.data or [])

    async def get_profile(self, token: str | None) -> dict[str, Any]:
        if not token:
            raise ValueError("Authentication required")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.PyJWTError:
            raise ValueError("Invalid token") from None

        user_id = payload.get("sub")
        try:
            client = await get_supabase_client()
            if user_id and isinstance(user_id, str) and user_id != "demo-user-id":
                response = await client.table("users").select("*").eq("id", user_id).limit(1).execute()
                row = (response.data or [None])[0]
            else:
                row = None
        except Exception:
            row = None
        if not row:
            return {
                "username": "alex_dfir",
                "title": "Lead Incident Responder",
                "xp": 2250,
                "level": 5,
                "labs_completed": 4,
                "average_accuracy": 88,
                "total_time_spent_minutes": 82,
            }
        return {
            "username": row.get("username"),
            "title": row.get("title"),
            "xp": row.get("xp"),
            "level": row.get("level"),
            "labs_completed": row.get("labs_completed"),
            "average_accuracy": row.get("average_accuracy"),
            "total_time_spent_minutes": row.get("total_time_spent_minutes"),
        }

    def _normalize(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "email": row.get("email"),
            "username": row.get("username"),
            "full_name": row.get("full_name"),
            "title": row.get("title"),
            "xp": row.get("xp", 0),
            "level": row.get("level", 1),
            "labs_completed": row.get("labs_completed", 0),
            "average_accuracy": row.get("average_accuracy", 0.0),
            "total_time_spent_minutes": row.get("total_time_spent_minutes", 0),
            "is_active": row.get("is_active", True),
        }
