from fastapi import APIRouter, HTTPException, Request

from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfile
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    try:
        return await service.login(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest) -> TokenResponse:
    try:
        return await service.register(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/me", response_model=UserProfile)
async def me(request: Request) -> UserProfile:
    token = request.headers.get("authorization", "").replace("Bearer ", "", 1)
    return await service.get_current_user_profile(token or None)
