from datetime import datetime, time
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class DeviceType(str, Enum):
    PUMP = "pump"
    HEATER = "heater"
    FEEDER = "feeder"


class DeviceStatus(str, Enum):
    ON = "on"
    OFF = "off"
    ERROR = "error"


class Device(BaseModel):
    device_id: str
    type: DeviceType
    name: str
    status: DeviceStatus = DeviceStatus.OFF
    last_updated: datetime = Field(default_factory=datetime.now)


class PumpDevice(Device):
    type: DeviceType = DeviceType.PUMP
    flow_rate: Optional[int] = None
    power_level: int = 100


class HeaterDevice(Device):
    type: DeviceType = DeviceType.HEATER
    target_temperature: float = 26.0
    current_temperature: Optional[float] = None
    min_temp: float = 20.0
    max_temp: float = 32.0


class FeederSchedule(BaseModel):
    id: str
    time: time
    portion: int = 1
    enabled: bool = True


class FeederDevice(Device):
    type: DeviceType = DeviceType.FEEDER
    schedules: List[FeederSchedule] = Field(default_factory=list)
    food_remaining: float = 100.0
    last_feed: Optional[datetime] = None
