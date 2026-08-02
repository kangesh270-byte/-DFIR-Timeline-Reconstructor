import json
import logging
import os
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

logger = logging.getLogger(__name__)

_supabase_client: "SupabaseRestClient | None" = None


class SupabaseRestClient:
    def __init__(self, url: str, key: str) -> None:
        self.base_url = url.rstrip("/")
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def table(self, table_name: str) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self, table_name)

    async def close(self) -> None:
        return None


class SupabaseTableQuery:
    def __init__(self, client: SupabaseRestClient, table_name: str) -> None:
        self.client = client
        self.table_name = table_name
        self.columns: str | None = None
        self.filters: list[tuple[str, str, Any]] = []
        self.order_by: tuple[str, bool] | None = None
        self.limit_value: int | None = None
        self.payload: dict[str, Any] | None = None
        self.method = "GET"

    def select(self, columns: str) -> "SupabaseTableQuery":
        self.columns = columns
        return self

    def eq(self, column: str, value: Any) -> "SupabaseTableQuery":
        self.filters.append(("eq", column, value))
        return self

    def order(self, column: str, desc: bool = False) -> "SupabaseTableQuery":
        self.order_by = (column, desc)
        return self

    def limit(self, count: int) -> "SupabaseTableQuery":
        self.limit_value = count
        return self

    def insert(self, payload: dict[str, Any]) -> "SupabaseTableQuery":
        self.payload = payload
        self.method = "POST"
        return self

    def update(self, payload: dict[str, Any]) -> "SupabaseTableQuery":
        self.payload = payload
        self.method = "PATCH"
        return self

    def delete(self) -> "SupabaseTableQuery":
        self.method = "DELETE"
        return self

    def _build_url(self) -> str:
        url = f"{self.client.base_url}/rest/v1/{self.table_name}"
        params: list[str] = []
        if self.columns is not None:
            params.append(f"select={quote(self.columns, safe='*,')}")
        for filter_type, column, value in self.filters:
            if filter_type == "eq":
                params.append(f"{column}=eq.{quote(str(value), safe='')}")
        if self.order_by is not None:
            column, descending = self.order_by
            suffix = "desc" if descending else "asc"
            params.append(f"order={column}.{suffix}")
        if self.limit_value is not None:
            params.append(f"limit={self.limit_value}")
        if params:
            return f"{url}?{'&'.join(params)}"
        return url

    async def execute(self) -> SimpleNamespace:
        url = self._build_url()
        async with httpx.AsyncClient(timeout=20.0) as session:
            if self.method == "POST":
                response = await session.post(url, headers=self.client.headers, json=self.payload or {})
            elif self.method == "PATCH":
                response = await session.patch(url, headers=self.client.headers, json=self.payload or {})
            elif self.method == "DELETE":
                response = await session.delete(url, headers=self.client.headers)
            else:
                response = await session.get(url, headers=self.client.headers)

        if response.status_code >= 400:
            error_body = response.text[:1000]
            logger.error("Supabase request failed for %s: %s %s", self.table_name, response.status_code, error_body)
            raise RuntimeError(f"Supabase request failed with {response.status_code}: {error_body}")

        text = response.text.strip()
        try:
            payload = json.loads(text) if text else []
        except json.JSONDecodeError:
            payload = []
        return SimpleNamespace(data=payload)


def _has_placeholder_value(value: str) -> bool:
    return "YOUR_PROJECT" in value or "YOUR_ANON_KEY" in value or "YOUR_SERVICE_ROLE_KEY" in value or value.startswith("<")


async def get_supabase_client() -> SupabaseRestClient:
    global _supabase_client
    if _supabase_client is None:
        url = (os.getenv("SUPABASE_URL") or "").strip()
        key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or "").strip()

        if not url or not key:
            raise RuntimeError("Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in the backend .env file.")

        if _has_placeholder_value(url) or _has_placeholder_value(key):
            raise RuntimeError("Supabase credentials still contain placeholder values. Replace them with real values before testing the connection.")

        _supabase_client = SupabaseRestClient(url, key)
    return _supabase_client


async def close_supabase_client() -> None:
    global _supabase_client
    if _supabase_client is not None:
        await _supabase_client.close()
        _supabase_client = None


async def test_supabase_connection() -> dict[str, Any]:
    client = await get_supabase_client()
    response = await client.table("scenarios").select("id").limit(1).execute()
    return {"data": response.data, "count": len(response.data or [])}
