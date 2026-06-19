from typing import List, Optional

from ..models import (
    Device,
    DeviceType,
    DeviceStatus,
    PumpDevice,
    HeaterDevice,
    FeederDevice,
    FeederSchedule,
)
from ..repositories import DeviceRepository


class DeviceService:
    def __init__(self, repository: Optional[DeviceRepository] = None):
        self._repo = repository or DeviceRepository()

    def get_all_devices(self) -> List[Device]:
        return self._repo.get_all()

    def get_device_by_id(self, device_id: str) -> Optional[Device]:
        return self._repo.get_by_id(device_id)

    def get_devices_by_type(self, device_type: DeviceType) -> List[Device]:
        return self._repo.get_by_type(device_type)

    async def toggle_device(self, device_id: str) -> Optional[Device]:
        device = self._repo.get_by_id(device_id)
        if not device:
            return None
        new_status = DeviceStatus.OFF if device.status == DeviceStatus.ON else DeviceStatus.ON
        return await self._repo.update_status(device_id, new_status)

    async def set_device_status(self, device_id: str, status: DeviceStatus) -> Optional[Device]:
        return await self._repo.update_status(device_id, status)

    async def set_pump_power(self, device_id: str, power_level: int) -> Optional[PumpDevice]:
        return await self._repo.update_pump(device_id, power_level)

    async def set_heater_temperature(self, device_id: str, target_temp: float) -> Optional[HeaterDevice]:
        device = self._repo.get_by_id(device_id)
        if isinstance(device, HeaterDevice):
            if target_temp < device.min_temp or target_temp > device.max_temp:
                return None
        return await self._repo.update_heater(device_id, target_temp)

    async def add_feeder_schedule(
        self,
        device_id: str,
        schedule_time: str,
        grams: float = 2.0,
        weekdays: Optional[List[int]] = None,
        enabled: bool = True,
    ) -> Optional[FeederDevice]:
        try:
            hour, minute = map(int, schedule_time.split(":"))
            from datetime import time as dt_time
            schedule = FeederSchedule(
                id="",
                time=dt_time(hour=hour, minute=minute),
                grams=max(0.0, grams),
                weekdays=sorted(set(d for d in (weekdays or [0, 1, 2, 3, 4, 5, 6]) if 0 <= d <= 6)),
                enabled=enabled,
            )
            return await self._repo.add_feeder_schedule(device_id, schedule)
        except (ValueError, AttributeError):
            return None

    async def update_feeder_schedule(
        self,
        device_id: str,
        schedule_id: str,
        *,
        schedule_time: Optional[str] = None,
        grams: Optional[float] = None,
        weekdays: Optional[List[int]] = None,
        enabled: Optional[bool] = None,
    ) -> Optional[FeederDevice]:
        feed_time = None
        if schedule_time is not None:
            try:
                hour, minute = map(int, schedule_time.split(":"))
                from datetime import time as dt_time
                feed_time = dt_time(hour=hour, minute=minute)
            except (ValueError, AttributeError):
                return None
        return await self._repo.update_feeder_schedule(
            device_id,
            schedule_id,
            feed_time=feed_time,
            grams=grams,
            weekdays=weekdays,
            enabled=enabled,
        )

    async def remove_feeder_schedule(self, device_id: str, schedule_id: str) -> Optional[FeederDevice]:
        return await self._repo.remove_feeder_schedule(device_id, schedule_id)

    async def toggle_feeder_schedule(self, device_id: str, schedule_id: str) -> Optional[FeederDevice]:
        return await self._repo.toggle_feeder_schedule(device_id, schedule_id)

    async def trigger_manual_feed(self, device_id: str, grams: float = 2.0) -> Optional[FeederDevice]:
        device = self._repo.get_by_id(device_id)
        if not device or not isinstance(device, FeederDevice):
            return None
        if device.status != DeviceStatus.ON:
            return None
        return await self._repo.trigger_feed_now(device_id, grams)

    async def simulate_heater_reading(self) -> List[HeaterDevice]:
        heaters = self._repo.get_by_type(DeviceType.HEATER)
        updated = []
        for heater in heaters:
            if isinstance(heater, HeaterDevice):
                result = await self._repo.simulate_heater_tick(heater.device_id)
                if result:
                    updated.append(result)
        return updated
