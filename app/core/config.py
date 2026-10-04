import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Minenager Cloud API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://minenager:minenager_dev_password@localhost:5432/minenager_cloud"
    )
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev_jwt_secret_key_minenager_vps_32bytes_min!")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "43200"))  # 30 days
    
    TUNNEL_RELAY_HOST: str = os.getenv("TUNNEL_RELAY_HOST", "relay.minenager.net")
    TUNNEL_RELAY_CONTROL_PORT: int = int(os.getenv("TUNNEL_RELAY_CONTROL_PORT", "2333"))

settings = Settings()
