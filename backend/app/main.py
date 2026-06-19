import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api import api_router
from .services import SensorService, DeviceService
from .websocket import ConnectionManager

app = FastAPI(
    title=settings.APP_NAME,
    description="循环水生态鱼缸远程管理系统 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sensor_service = SensorService()
_device_service = DeviceService()
_ws_manager = ConnectionManager(_sensor_service, _device_service)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await _ws_manager.connect(websocket)
    try:
        initial_sensors = _sensor_service.get_all_sensors()
        initial_devices = _device_service.get_all_devices()
        init_msg = {
            "type": "initial_state",
            "sensors": [
                {
                    "sensor_id": s.sensor_id,
                    "type": s.type.value,
                    "name": s.name,
                    "status": s.status,
                    "current": {
                        "value": s.current.value,
                        "timestamp": s.current.timestamp.isoformat() if hasattr(s.current.timestamp, 'isoformat') else str(s.current.timestamp),
                        "unit": s.current.unit,
                    },
                    "min_value": s.min_value,
                    "max_value": s.max_value,
                }
                for s in initial_sensors
            ],
            "devices": [
                {
                    "device_id": d.device_id,
                    "type": d.type.value,
                    "name": d.name,
                    "status": d.status.value,
                    "last_updated": d.last_updated.isoformat() if hasattr(d.last_updated, 'isoformat') else str(d.last_updated),
                    "target_temperature": getattr(d, "target_temperature", None),
                    "current_temperature": getattr(d, "current_temperature", None),
                    "power_level": getattr(d, "power_level", None),
                    "flow_rate": getattr(d, "flow_rate", None),
                    "schedules": getattr(d, "schedules", []),
                    "food_remaining": getattr(d, "food_remaining", None),
                }
                for d in initial_devices
            ],
        }
        await websocket.send_text(json.dumps(init_msg, default=str))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await _ws_manager.disconnect(websocket)
    except Exception:
        await _ws_manager.disconnect(websocket)
