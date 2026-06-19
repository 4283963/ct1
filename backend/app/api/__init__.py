from fastapi import APIRouter

from .sensors import router as sensors_router
from .devices import router as devices_router

api_router = APIRouter()
api_router.include_router(sensors_router, prefix="/sensors", tags=["sensors"])
api_router.include_router(devices_router, prefix="/devices", tags=["devices"])

__all__ = ["api_router"]
