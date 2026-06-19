from datetime import datetime
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

    def toggle_device(self, device_id: str) -> Optional[Device]:
        device = self._repo.get_by_id(device_id)
        if not device:
            return None
        new_status = DeviceStatus.OFF if device.status == DeviceStatus.ON else DeviceStatus.ON
        return self._repo.update_status(device_id, new_status)

    def set_device_status(self, device_id: str, status: DeviceStatus) -> Optional[Device]:
        return self._repo.update_status(device_id, status)

    def set_pump_power(self, device_id: str, power_level: int) -> Optional[PumpDevice]:
        return self._repo.update_pump(device_id, power_level)

    def set_heater_temperature(self, device_id: str, target_temp: float) -> Optional[HeaterDevice]:
        device = self._repo.get_by_id(device_id)
        if isinstance(device, HeaterDevice):
            if target_temp < device.min_temp or target_temp > device.max_temp:
                return None
        return self._repo.update_heater(device_id, target_temp)

    def add_feeder_schedule(
        self, device_id: str, schedule_time: str, portion: int = 1, enabled: bool = True
    ) -> Optional[FeederDevice]:
        try:
            hour, minute = map(int, schedule_time.split(":"))
            from datetime import time as dt_time
            schedule = FeederSchedule(
                id="",
                time=dt_time(hour=hour, minute=minute),
                portion=portion,
                enabled=enabled,
            )
            return self._repo.add_feeder_schedule(device_id, schedule)
        except (ValueError, AttributeError):
            return None

    def remove_feeder_schedule(self, device_id: str, schedule_id: str) -> Optional[FeederDevice]:
        return self._repo.remove_feeder_schedule(device_id, schedule_id)

    def toggle_feeder_schedule(self, device_id: str, schedule_id: str) -> Optional[FeederDevice]:
        return self._repo.toggle_feeder_schedule(device_id, schedule_id)

    def trigger_manual_feed(self, device_id: str, portion: int = 1) -> Optional[FeederDevice]:
        device = self._repo.get_by_id(device_id)
        if not device or not isinstance(device, FeederDevice):
            return None
        if device.status != DeviceStatus.ON:
            return None
        return self._repo.trigger_feed_now(device_id, portion)

    def simulate_heater_reading(self) -> List[HeaterDevice]:
        heaters = self._repo.get_by_type(DeviceType.HEATER)
        updated = []
        for heater in heaters:
            if isinstance(heater, HeaterDevice) and heater.status == DeviceStatus.ON:
                current = heater.current_temperature or heater.target_temperature
                target = heater.target_temperature
                delta = (target - current) * 0.1
                heater.current_temperature = round(current + delta, 2)
                heater.last_updated = datetime.now()
                updated.append(heater)
        return updated
