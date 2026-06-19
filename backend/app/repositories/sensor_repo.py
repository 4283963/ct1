import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import random

from ..models import SensorData, SensorType, SensorReading


class SensorRepository:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._sensors: Dict[str, SensorData] = self._initialize_mock_sensors()

    def _initialize_mock_sensors(self) -> Dict[str, SensorData]:
        now = datetime.now()
        sensors = {}

        temp_history = []
        for i in range(60, 0, -1):
            temp_history.append(
                SensorReading(
                    value=round(25.0 + random.uniform(-1.0, 1.0), 2),
                    timestamp=now - timedelta(minutes=i),
                    unit="°C",
                )
            )
        sensors["temp_001"] = SensorData(
            sensor_id="temp_001",
            type=SensorType.TEMPERATURE,
            name="水温传感器",
            current=temp_history[-1],
            history=temp_history,
            min_value=20.0,
            max_value=30.0,
            warning_threshold=28.0,
            critical_threshold=30.0,
        )

        ph_history = []
        for i in range(60, 0, -1):
            ph_history.append(
                SensorReading(
                    value=round(7.0 + random.uniform(-0.3, 0.3), 2),
                    timestamp=now - timedelta(minutes=i),
                    unit="pH",
                )
            )
        sensors["ph_001"] = SensorData(
            sensor_id="ph_001",
            type=SensorType.PH,
            name="pH 值传感器",
            current=ph_history[-1],
            history=ph_history,
            min_value=6.0,
            max_value=8.5,
            warning_threshold=7.8,
            critical_threshold=8.2,
        )

        filter_history = []
        for i in range(60, 0, -1):
            decay = i * 0.001
            filter_history.append(
                SensorReading(
                    value=round(max(0, 78.5 - decay + random.uniform(-0.1, 0.1)), 2),
                    timestamp=now - timedelta(minutes=i),
                    unit="%",
                )
            )
        sensors["filter_001"] = SensorData(
            sensor_id="filter_001",
            type=SensorType.FILTER_LIFE,
            name="滤材寿命",
            current=filter_history[-1],
            history=filter_history,
            min_value=0.0,
            max_value=100.0,
            warning_threshold=30.0,
            critical_threshold=15.0,
        )

        return sensors

    def get_all(self) -> List[SensorData]:
        return list(self._sensors.values())

    def get_by_id(self, sensor_id: str) -> Optional[SensorData]:
        return self._sensors.get(sensor_id)

    def get_by_type(self, sensor_type: SensorType) -> List[SensorData]:
        return [s for s in self._sensors.values() if s.type == sensor_type]

    async def update_reading(self, sensor_id: str, reading: SensorReading) -> Optional[SensorData]:
        async with self._lock:
            sensor = self._sensors.get(sensor_id)
            if not sensor:
                return None
            sensor.current = reading
            sensor.history.append(reading)
            if len(sensor.history) > 120:
                sensor.history = sensor.history[-120:]
            sensor.status = self._evaluate_status(sensor)
            return sensor

    def _evaluate_status(self, sensor: SensorData) -> str:
        value = sensor.current.value
        if sensor.critical_threshold is not None:
            if sensor.type in (SensorType.TEMPERATURE, SensorType.PH):
                if value >= sensor.critical_threshold:
                    return "critical"
            elif sensor.type == SensorType.FILTER_LIFE:
                if value <= sensor.critical_threshold:
                    return "critical"
        if sensor.warning_threshold is not None:
            if sensor.type in (SensorType.TEMPERATURE, SensorType.PH):
                if value >= sensor.warning_threshold:
                    return "warning"
            elif sensor.type == SensorType.FILTER_LIFE:
                if value <= sensor.warning_threshold:
                    return "warning"
        return "normal"
