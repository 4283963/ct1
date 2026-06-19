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


WEEKDAY_LABELS = {
    0: "周一",
    1: "周二",
    2: "周三",
    3: "周四",
    4: "周五",
    5: "周六",
    6: "周日",
}


class FeederSchedule(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    time: time
    grams: float = 2.0
    weekdays: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    enabled: bool = True

    @property
    def weekdays_label(self) -> str:
        if len(self.weekdays) == 7:
            return "每天"
        if set(self.weekdays) == {0, 1, 2, 3, 4}:
            return "工作日"
        if set(self.weekdays) == {5, 6}:
            return "周末"
        return "、".join(WEEKDAY_LABELS.get(d, str(d)) for d in sorted(self.weekdays))

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        data["weekdays_label"] = self.weekdays_label
        data["time"] = self.time.strftime("%H:%M")
        return data


class FeederDevice(Device):
    type: DeviceType = DeviceType.FEEDER
    schedules: List[FeederSchedule] = Field(default_factory=list)
    food_remaining: float = 100.0
    last_feed: Optional[datetime] = None
