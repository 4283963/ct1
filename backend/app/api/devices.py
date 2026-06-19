from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, Body
from pydantic import BaseModel

from ...models import Device, DeviceType, DeviceStatus, FeederSchedule
from ...services import DeviceService

router = APIRouter()

_device_service: Optional[DeviceService] = None


def get_device_service() -> DeviceService:
    global _device_service
    if _device_service is None:
        _device_service = DeviceService()
    return _device_service


class StatusUpdate(BaseModel):
    status: DeviceStatus


class PumpPowerUpdate(BaseModel):
    power_level: int


class HeaterTempUpdate(BaseModel):
    target_temperature: float


class FeederScheduleCreate(BaseModel):
    time: str
    portion: int = 1
    enabled: bool = True


class ManualFeedRequest(BaseModel):
    portion: int = 1


@router.get("", response_model=List[Device])
async def list_devices(
    type: Optional[DeviceType] = Query(None, description="按设备类型过滤"),
    service: DeviceService = Depends(get_device_service),
):
    if type:
        return service.get_devices_by_type(type)
    return service.get_all_devices()


@router.get("/{device_id}", response_model=Device)
async def get_device(
    device_id: str,
    service: DeviceService = Depends(get_device_service),
):
    device = service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail=f"设备 {device_id} 不存在")
    return device


@router.post("/{device_id}/toggle", response_model=Device)
async def toggle_device(
    device_id: str,
    service: DeviceService = Depends(get_device_service),
):
    device = service.toggle_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail=f"设备 {device_id} 不存在")
    return device


@router.put("/{device_id}/status", response_model=Device)
async def set_device_status(
    device_id: str,
    update: StatusUpdate,
    service: DeviceService = Depends(get_device_service),
):
    device = service.set_device_status(device_id, update.status)
    if not device:
        raise HTTPException(status_code=404, detail=f"设备 {device_id} 不存在")
    return device


@router.put("/{device_id}/pump/power", response_model=Device)
async def set_pump_power(
    device_id: str,
    update: PumpPowerUpdate,
    service: DeviceService = Depends(get_device_service),
):
    if update.power_level < 0 or update.power_level > 100:
        raise HTTPException(status_code=400, detail="功率等级必须在 0-100 之间")
    device = service.set_pump_power(device_id, update.power_level)
    if not device:
        raise HTTPException(status_code=404, detail=f"水泵 {device_id} 不存在")
    return device


@router.put("/{device_id}/heater/temperature", response_model=Device)
async def set_heater_temperature(
    device_id: str,
    update: HeaterTempUpdate,
    service: DeviceService = Depends(get_device_service),
):
    device = service.set_heater_temperature(device_id, update.target_temperature)
    if not device:
        raise HTTPException(
            status_code=400,
            detail=f"温度设置失败，目标温度超出有效范围或设备 {device_id} 不存在",
        )
    return device


@router.post("/{device_id}/feeder/schedules", response_model=Device)
async def add_feeder_schedule(
    device_id: str,
    schedule: FeederScheduleCreate,
    service: DeviceService = Depends(get_device_service),
):
    device = service.add_feeder_schedule(device_id, schedule.time, schedule.portion, schedule.enabled)
    if not device:
        raise HTTPException(status_code=404, detail=f"喂食机 {device_id} 不存在或时间格式错误")
    return device


@router.delete("/{device_id}/feeder/schedules/{schedule_id}", response_model=Device)
async def remove_feeder_schedule(
    device_id: str,
    schedule_id: str,
    service: DeviceService = Depends(get_device_service),
):
    device = service.remove_feeder_schedule(device_id, schedule_id)
    if not device:
        raise HTTPException(status_code=404, detail=f"喂食机 {device_id} 不存在")
    return device


@router.post("/{device_id}/feeder/schedules/{schedule_id}/toggle", response_model=Device)
async def toggle_feeder_schedule(
    device_id: str,
    schedule_id: str,
    service: DeviceService = Depends(get_device_service),
):
    device = service.toggle_feeder_schedule(device_id, schedule_id)
    if not device:
        raise HTTPException(status_code=404, detail=f"喂食机 {device_id} 不存在")
    return device


@router.post("/{device_id}/feeder/feed", response_model=Device)
async def trigger_manual_feed(
    device_id: str,
    request: ManualFeedRequest = Body(default=ManualFeedRequest()),
    service: DeviceService = Depends(get_device_service),
):
    device = service.trigger_manual_feed(device_id, request.portion)
    if not device:
        raise HTTPException(
            status_code=400,
            detail=f"手动喂食失败，设备 {device_id} 不存在或未开启",
        )
    return device
