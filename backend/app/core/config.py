from pydantic_settings import BaseSettings
from typing import List
import secrets

class Settings(BaseSettings):
    # App
    APP_NAME: str = "WishingWall"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://wishingwalldb_user:kQBGEDzu7f83MTg6VLScMgi4yQqAsvhi@dpg-d486qdi4d50c738jcung-a/wishingwalldb"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://wishingwall.app",
        "https://www.wishingwall.app"
    ]
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    
    # Wall
    WALL_URL_BASE: str = "https://wishingwall.app/wall"
    
    # Frontend URL for email links
    FRONTEND_URL: str = "https://wishingwall.app"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

