from fastapi import APIRouter, HTTPException, Request

from ..schemas.user import UserCreate, UserOut, UserUpdate
from ..services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])
service = UserService()


@router.get("", response_model=list[UserOut])
async def list_users() -> list[UserOut]:
    return await service.list_users()


@router.post("", response_model=UserOut)
async def create_user(payload: UserCreate) -> UserOut:
    try:
        return await service.create_user(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/profile")
async def get_profile(request: Request) -> dict:
    token = request.headers.get("authorization", "")
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    else:
        token = token.strip() or None

    try:
        return await service.get_profile(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str) -> UserOut:
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate) -> UserOut:
    user = await service.update_user(user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: str) -> dict:
    deleted = await service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True, "id": user_id}


