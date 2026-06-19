import asyncio
from datetime import datetime, time
from typing import Dict, List, Optional
import uuid

from ..models import (
    Device,
    DeviceType,
    DeviceStatus,
    PumpDevice,
    HeaterDevice,
    FeederDevice,
    FeederSchedule,
)


class DeviceRepository:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._devices: Dict[str, Device] = self._initialize_mock_devices()

    def _initialize_mock_devices(self) -> Dict[str, Device]:
        devices = {}

        devices["pump_001"] = PumpDevice(
            device_id="pump_001",
            type=DeviceType.PUMP,
            name="主循环水泵",
            status=DeviceStatus.ON,
            flow_rate=1200,
            power_level=85,
        )

        devices["heater_001"] = HeaterDevice(
            device_id="heater_001",
            type=DeviceType.HEATER,
            name="加热棒",
            status=DeviceStatus.ON,
            target_temperature=26.0,
            current_temperature=25.8,
        )

        devices["feeder_001"] = FeederDevice(
            device_id="feeder_001",
            type=DeviceType.FEEDER,
            name="自动喂食机",
            status=DeviceStatus.ON,
            schedules=[
                FeederSchedule(
                    id=str(uuid.uuid4()),
                    time=time(8, 0),
                    portion=2,
                    enabled=True,
                ),
                FeederSchedule(
                    id=str(uuid.uuid4()),
                    time=time(18, 0),
                    portion=2,
                    enabled=True,
                ),
            ],
            food_remaining=82.5,
        )

        return devices

    def get_all(self) -> List[Device]:
        return list(self._devices.values())

    def get_by_id(self, device_id: str) -> Optional[Device]:
        return self._devices.get(device_id)

    def get_by_type(self, device_type: DeviceType) -> List[Device]:
        return [d for d in self._devices.values() if d.type == device_type]

    async def update_status(self, device_id: str, status: DeviceStatus) -> Optional[Device]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device:
                return None
            device.status = status
            device.last_updated = datetime.now()
            return device

    async def update_pump(
        self, device_id: str, power_level: int, flow_rate: Optional[int] = None
    ) -> Optional[PumpDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, PumpDevice):
                return None
            device.power_level = max(0, min(100, power_level))
            if flow_rate is not None:
                device.flow_rate = flow_rate
            device.last_updated = datetime.now()
            return device

    async def update_heater(self, device_id: str, target_temp: float) -> Optional[HeaterDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, HeaterDevice):
                return None
            device.target_temperature = max(device.min_temp, min(device.max_temp, target_temp))
            device.last_updated = datetime.now()
            return device

    async def simulate_heater_tick(self, device_id: str) -> Optional[HeaterDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, HeaterDevice):
                return None
            if device.status != DeviceStatus.ON:
                return device
            current = device.current_temperature or device.target_temperature
            target = device.target_temperature
            delta = (target - current) * 0.1
            device.current_temperature = round(current + delta, 2)
            device.last_updated = datetime.now()
            return device

    async def add_feeder_schedule(
        self, device_id: str, schedule: FeederSchedule
    ) -> Optional[FeederDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, FeederDevice):
                return None
            schedule.id = str(uuid.uuid4())
            device.schedules.append(schedule)
            device.last_updated = datetime.now()
            return device

    async def remove_feeder_schedule(
        self, device_id: str, schedule_id: str
    ) -> Optional[FeederDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, FeederDevice):
                return None
            device.schedules = [s for s in device.schedules if s.id != schedule_id]
            device.last_updated = datetime.now()
            return device

    async def toggle_feeder_schedule(
        self, device_id: str, schedule_id: str
    ) -> Optional[FeederDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, FeederDevice):
                return None
            for s in device.schedules:
                if s.id == schedule_id:
                    s.enabled = not s.enabled
                    break
            device.last_updated = datetime.now()
            return device

    async def trigger_feed_now(
        self, device_id: str, portion: int = 1
    ) -> Optional[FeederDevice]:
        async with self._lock:
            device = self._devices.get(device_id)
            if not device or not isinstance(device, FeederDevice):
                return None
            device.last_feed = datetime.now()
            device.food_remaining = max(0.0, device.food_remaining - portion * 2.0)
            device.last_updated = datetime.now()
            return device
