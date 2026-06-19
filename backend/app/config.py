from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Aquarium IoT Management System"
    DEBUG: bool = True
    SENSOR_POLL_INTERVAL: float = 2.0
    WEBSOCKET_BROADCAST_INTERVAL: float = 2.0

    class Config:
        env_file = ".env"


settings = Settings()
