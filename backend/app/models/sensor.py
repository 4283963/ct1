from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class SensorType(str, Enum):
    TEMPERATURE = "temperature"
    PH = "ph"
    FILTER_LIFE = "filter_life"


class SensorReading(BaseModel):
    value: float
    timestamp: datetime = Field(default_factory=datetime.now)
    unit: str


class SensorData(BaseModel):
    sensor_id: str
    type: SensorType
    name: str
    current: SensorReading
    history: List[SensorReading] = Field(default_factory=list)
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    status: str = "normal"
