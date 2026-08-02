from fastapi import APIRouter, HTTPException

from ..schemas.scenario import ScenarioCreate, ScenarioOut, ScenarioUpdate
from ..services.scenario_service import ScenarioService

router = APIRouter(prefix="/scenarios", tags=["scenarios"])
service = ScenarioService()


@router.get("", response_model=list[ScenarioOut])
async def list_scenarios() -> list[ScenarioOut]:
    return await service.list_scenarios()


@router.post("", response_model=ScenarioOut)
async def create_scenario(payload: ScenarioCreate) -> ScenarioOut:
    try:
        return await service.create_scenario(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{scenario_id}", response_model=ScenarioOut)
async def get_scenario(scenario_id: str) -> ScenarioOut:
    scenario = await service.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.patch("/{scenario_id}", response_model=ScenarioOut)
async def update_scenario(scenario_id: str, payload: ScenarioUpdate) -> ScenarioOut:
    scenario = await service.update_scenario(scenario_id, payload)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.delete("/{scenario_id}")
async def delete_scenario(scenario_id: str) -> dict:
    deleted = await service.delete_scenario(scenario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"deleted": True, "id": scenario_id}
