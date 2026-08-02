import unittest
from unittest.mock import AsyncMock, patch

from app.services.auth_service import AuthService


class AuthServiceFallbackTests(unittest.IsolatedAsyncioTestCase):
    async def test_login_falls_back_to_demo_credentials_when_supabase_is_unavailable(self) -> None:
        service = AuthService()

        with patch("app.services.auth_service.get_supabase_client", new=AsyncMock(side_effect=RuntimeError("Supabase unavailable"))):
            response = await service.login("analyst@dfir.local", "changeme")

        self.assertIsNotNone(response.access_token)
        self.assertIsNotNone(response.refresh_token)


if __name__ == "__main__":
    unittest.main()
