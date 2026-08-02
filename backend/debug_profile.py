import asyncio
from app.services.auth_service import AuthService
from app.services.user_service import UserService

async def main() -> None:
    token = AuthService()._build_tokens(AuthService()._demo_user()).access_token
    try:
        result = await UserService().get_profile(token)
        print(result)
    except Exception:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
