"""
Application configuration with environment variable validation.

Validates all required environment variables at startup to fail fast
if critical configuration is missing.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with validation."""

    # Database - Neon Postgres (pooled connection string)
    database_url: str = Field(..., description="Postgres connection string")

    # Auth
    secret_key: str = Field(..., description="Secret used to sign JWTs")

    # Frontend
    frontend_url: str = Field("http://localhost:3000", description="Frontend URL for CORS")

    # Rate Limiting
    rate_limit_requests: int = Field(10, description="Max requests per minute for auth endpoints")
    rate_limit_period_seconds: int = Field(60, description="Rate limit period in seconds")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

    def get_database_url(self) -> str:
        """Get SQLAlchemy database URL (postgres:// is converted to postgresql://)."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the application settings instance."""
    return settings
