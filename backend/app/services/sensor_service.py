from datetime import datetime
from typing import List, Optional
import random

from ..models import SensorData, SensorType, SensorReading
from ..repositories import SensorRepository


class SensorService:
    def __init__(self, repository: Optional[SensorRepository] = None):
        self._repo = repository or SensorRepository()

    def get_all_sensors(self) -> List[SensorData]:
        return self._repo.get_all()

    def get_sensor_by_id(self, sensor_id: str) -> Optional[SensorData]:
        return self._repo.get_by_id(sensor_id)

    def get_sensors_by_type(self, sensor_type: SensorType) -> List[SensorData]:
        return self._repo.get_by_type(sensor_type)

    async def simulate_sensor_readings(self) -> List[SensorData]:
        sensors = self._repo.get_all()
        updated = []
        for sensor in sensors:
            new_value = self._generate_next_value(sensor)
            reading = SensorReading(
                value=new_value,
                timestamp=datetime.now(),
                unit=sensor.current.unit,
            )
            updated_sensor = await self._repo.update_reading(sensor.sensor_id, reading)
            if updated_sensor:
                updated.append(updated_sensor)
        return updated

    def _generate_next_value(self, sensor: SensorData) -> float:
        current = sensor.current.value
        if sensor.type == SensorType.TEMPERATURE:
            delta = random.uniform(-0.15, 0.15)
            return round(max(22.0, min(29.0, current + delta)), 2)
        elif sensor.type == SensorType.PH:
            delta = random.uniform(-0.05, 0.05)
            return round(max(6.3, min(7.8, current + delta)), 2)
        elif sensor.type == SensorType.FILTER_LIFE:
            delta = random.uniform(-0.02, 0.0)
            return round(max(0.0, min(100.0, current + delta)), 2)
        return current

    def get_sensor_history(self, sensor_id: str, limit: int = 60) -> Optional[List[SensorReading]]:
        sensor = self._repo.get_by_id(sensor_id)
        if not sensor:
            return None
        return sensor.history[-limit:] if limit > 0 else sensor.history
