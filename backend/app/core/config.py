"""
Application configuration using Pydantic settings.
All configuration values are loaded from environment variables.
"""
from typing import List, Union, Any, Dict
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, model_validator


class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Application
    APP_NAME: str = "FGC Money Match API"
    APP_ENV: str = Field(default="development", env="APP_ENV")
    DEBUG: bool = Field(default=False, env="DEBUG")
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Database
    DATABASE_URL: str = Field(
        ...,
        env="DATABASE_URL",
        description="PostgreSQL connection string with asyncpg driver"
    )
    
    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    
    # JWT Authentication
    JWT_SECRET_KEY: str = Field(
        ...,
        env="JWT_SECRET_KEY",
        min_length=32,
        description="Secret key for JWT token signing (min 32 chars)"
    )
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        env="JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    )
    
    # Payment Gateway (Stripe)
    STRIPE_SECRET_KEY: str = Field(..., env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(..., env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", env="STRIPE_WEBHOOK_SECRET")
    STRIPE_PLATFORM_FEE_PERCENT: int = Field(
        default=5,
        env="STRIPE_PLATFORM_FEE_PERCENT",
        ge=0,
        le=100,
        description="Platform fee percentage (0-100)"
    )
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        env="CORS_ORIGINS"
    )
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=100,
        env="RATE_LIMIT_PER_MINUTE"
    )
    RATE_LIMIT_AUTH_PER_MINUTE: int = Field(
        default=5,
        env="RATE_LIMIT_AUTH_PER_MINUTE"
    )
    
    # Security
    ALLOWED_HOSTS: Union[List[str], str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    SECURE_COOKIES: bool = Field(
        default=False,
        env="SECURE_COOKIES",
        description="Set to True in production with HTTPS"
    )
    
    # Email (Future)
    SMTP_HOST: str = Field(default="", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str = Field(default="", env="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    EMAIL_FROM: str = Field(default="noreply@fgcmatch.com", env="EMAIL_FROM")
    
    # File Storage (Future - S3)
    AWS_ACCESS_KEY_ID: str = Field(default="", env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", env="AWS_SECRET_ACCESS_KEY")
    AWS_S3_BUCKET: str = Field(default="", env="AWS_S3_BUCKET")
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string or list."""
        if v is None:
            return ["http://localhost:5173", "http://localhost:3000"]
        if isinstance(v, str):
            # Handle comma-separated string (not JSON)
            origins = [origin.strip() for origin in v.split(",") if origin.strip()]
            return origins if origins else ["http://localhost:5173", "http://localhost:3000"]
        if isinstance(v, list):
            return v
        return v
    
    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v):
        """Parse allowed hosts from comma-separated string or list."""
        if isinstance(v, str):
            # Handle comma-separated string
            return [host.strip() for host in v.split(",") if host.strip()]
        if isinstance(v, list):
            return v
        return v
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v):
        """Ensure JWT secret is strong enough."""
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        return v
    
    @model_validator(mode="before")
    @classmethod
    def parse_list_fields(cls, data: Any) -> Any:
        """Parse comma-separated strings for list fields before JSON parsing."""
        if isinstance(data, dict):
            # Handle CORS_ORIGINS if it's a string (not JSON)
            if "CORS_ORIGINS" in data and isinstance(data["CORS_ORIGINS"], str):
                if not (data["CORS_ORIGINS"].strip().startswith("[") or data["CORS_ORIGINS"].strip().startswith("{")):
                    data["CORS_ORIGINS"] = [origin.strip() for origin in data["CORS_ORIGINS"].split(",") if origin.strip()]
            # Handle ALLOWED_HOSTS if it's a string (not JSON)
            if "ALLOWED_HOSTS" in data and isinstance(data["ALLOWED_HOSTS"], str):
                if not (data["ALLOWED_HOSTS"].strip().startswith("[") or data["ALLOWED_HOSTS"].strip().startswith("{")):
                    data["ALLOWED_HOSTS"] = [host.strip() for host in data["ALLOWED_HOSTS"].split(",") if host.strip()]
        return data
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
