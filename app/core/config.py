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
    
    TUNNEL_RELAY_HOST: str = os.getenv("TUNNEL_RELAY_HOST", "127.0.0.1")
    TUNNEL_RELAY_CONTROL_PORT: int = int(os.getenv("TUNNEL_RELAY_CONTROL_PORT", "2333"))
    TUNNEL_RELAY_TOKEN: str = os.getenv("TUNNEL_RELAY_TOKEN", "minenager_tunnel_dev_secret_token_12345")
    
    # Custom Subdomain & Vanilla Port Resolution (SRV DNS)
    TUNNEL_DOMAIN: str = os.getenv("TUNNEL_DOMAIN", "minenager.net")
    CLOUDFLARE_API_TOKEN: str = os.getenv("CLOUDFLARE_API_TOKEN", "")
    CLOUDFLARE_ZONE_ID: str = os.getenv("CLOUDFLARE_ZONE_ID", "")

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Admin Dashboard Credentials
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "minenager_admin_password_2026!")

    # Stripe Payment & Subscription Configuration
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PRICE_ID: str = os.getenv("STRIPE_PRICE_ID", "price_1UMwklRg74MeE2fvhbObV3Lm")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    DOMAIN: str = os.getenv("DOMAIN", "http://localhost:3000")

settings = Settings()
