from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends

from ...models import SensorData, SensorType
from ...services import SensorService

router = APIRouter()

_sensor_service: Optional[SensorService] = None


def get_sensor_service() -> SensorService:
    global _sensor_service
    if _sensor_service is None:
        _sensor_service = SensorService()
    return _sensor_service


@router.get("", response_model=List[SensorData])
async def list_sensors(
    type: Optional[SensorType] = Query(None, description="按传感器类型过滤"),
    service: SensorService = Depends(get_sensor_service),
):
    if type:
        return service.get_sensors_by_type(type)
    return service.get_all_sensors()


@router.get("/{sensor_id}", response_model=SensorData)
async def get_sensor(
    sensor_id: str,
    service: SensorService = Depends(get_sensor_service),
):
    sensor = service.get_sensor_by_id(sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail=f"传感器 {sensor_id} 不存在")
    return sensor


@router.get("/{sensor_id}/history")
async def get_sensor_history(
    sensor_id: str,
    limit: int = Query(60, ge=1, le=200, description="返回的历史数据条数"),
    service: SensorService = Depends(get_sensor_service),
):
    history = service.get_sensor_history(sensor_id, limit)
    if history is None:
        raise HTTPException(status_code=404, detail=f"传感器 {sensor_id} 不存在")
    return {"sensor_id": sensor_id, "history": history}


@router.post("/{sensor_id}/refresh", response_model=SensorData)
async def refresh_sensor(
    sensor_id: str,
    service: SensorService = Depends(get_sensor_service),
):
    sensor = service.get_sensor_by_id(sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail=f"传感器 {sensor_id} 不存在")
    updated = service.simulate_sensor_readings()
    for s in updated:
        if s.sensor_id == sensor_id:
            return s
    return sensor
