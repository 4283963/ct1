import asyncio
import json
from typing import List, Set
from fastapi import WebSocket

from ..services import SensorService, DeviceService
from ..config import settings


class ConnectionManager:
    def __init__(self, sensor_service: SensorService, device_service: DeviceService):
        self._active_connections: Set[WebSocket] = set()
        self._sensor_service = sensor_service
        self._device_service = device_service
        self._broadcast_task: asyncio.Task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._active_connections.add(websocket)
        if self._broadcast_task is None or self._broadcast_task.done():
            self._broadcast_task = asyncio.create_task(self._broadcast_loop())

    async def disconnect(self, websocket: WebSocket):
        self._active_connections.discard(websocket)
        if not self._active_connections and self._broadcast_task:
            self._broadcast_task.cancel()
            self._broadcast_task = None

    async def _broadcast_loop(self):
        try:
            while self._active_connections:
                sensors = self._sensor_service.simulate_sensor_readings()
                heaters = self._device_service.simulate_heater_reading()
                message = {
                    "type": "realtime_update",
                    "timestamp": self._get_iso_timestamp(),
                    "sensors": [self._sensor_to_dict(s) for s in sensors],
                    "devices": [self._device_to_dict(d) for d in heaters],
                }
                await self._broadcast(json.dumps(message, default=str))
                await asyncio.sleep(settings.WEBSOCKET_BROADCAST_INTERVAL)
        except asyncio.CancelledError:
            pass

    async def _broadcast(self, message: str):
        dead_connections: List[WebSocket] = []
        for connection in self._active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for conn in dead_connections:
            self._active_connections.discard(conn)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception:
            await self.disconnect(websocket)

    def _get_iso_timestamp(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()

    def _sensor_to_dict(self, sensor):
        return {
            "sensor_id": sensor.sensor_id,
            "type": sensor.type.value,
            "name": sensor.name,
            "status": sensor.status,
            "current": {
                "value": sensor.current.value,
                "timestamp": sensor.current.timestamp.isoformat() if hasattr(sensor.current.timestamp, 'isoformat') else str(sensor.current.timestamp),
                "unit": sensor.current.unit,
            },
        }

    def _device_to_dict(self, device):
        base = {
            "device_id": device.device_id,
            "type": device.type.value,
            "name": device.name,
            "status": device.status.value,
            "last_updated": device.last_updated.isoformat() if hasattr(device.last_updated, 'isoformat') else str(device.last_updated),
        }
        if hasattr(device, "target_temperature"):
            base["target_temperature"] = device.target_temperature
            base["current_temperature"] = device.current_temperature
        if hasattr(device, "power_level"):
            base["power_level"] = device.power_level
            base["flow_rate"] = device.flow_rate
        return base
