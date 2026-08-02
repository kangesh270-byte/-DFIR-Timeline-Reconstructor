from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_profile_route_returns_401_for_missing_token() -> None:
    response = client.get("/users/profile")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required"


def test_profile_route_returns_401_for_invalid_token() -> None:
    response = client.get(
        "/users/profile",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"
