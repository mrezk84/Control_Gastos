"""
Application configuration with environment variable validation.

Validates all required environment variables at startup to fail fast
if critical configuration is missing.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with validation."""

    # Security
    secret_key: str = Field(..., description="JWT secret key (use openssl rand -base64 64)")
    token_expiration_minutes: int = Field(30, description="JWT token expiration in minutes")

    # Database - Support both DATABASE_URL and individual params
    database_url: Optional[str] = Field(None, description="Complete database URL (takes precedence)")

    # Legacy database params (for MySQL/MariaDB)
    db_host: Optional[str] = Field(None, description="Database host")
    db_port: Optional[int] = Field(None, description="Database port")
    db_user: Optional[str] = Field(None, description="Database user")
    db_pass: Optional[str] = Field(None, description="Database password")
    db_name: Optional[str] = Field(None, description="Database name")

    # Frontend
    frontend_url: str = Field("http://localhost:5173", description="Frontend URL for CORS")

    # Google OAuth
    google_client_id: Optional[str] = Field(None, description="Google OAuth client ID")
    google_client_secret: Optional[str] = Field(None, description="Google OAuth client secret")
    google_redirect_uri: str = Field(
        "http://localhost:8000/auth/google/callback",
        description="Google OAuth redirect URI"
    )

    # Microsoft OAuth
    microsoft_client_id: Optional[str] = Field(None, description="Microsoft OAuth client ID")
    microsoft_client_secret: Optional[str] = Field(None, description="Microsoft OAuth client secret")
    microsoft_redirect_uri: str = Field(
        "http://localhost:8000/auth/microsoft/callback",
        description="Microsoft OAuth redirect URI"
    )

    # Apple OAuth
    apple_client_id: Optional[str] = Field(None, description="Apple OAuth client ID")
    apple_team_id: Optional[str] = Field(None, description="Apple team ID")
    apple_key_id: Optional[str] = Field(None, description="Apple key ID")
    apple_key_file: Optional[str] = Field(None, description="Path to Apple key file")
    apple_redirect_uri: str = Field(
        "http://localhost:8000/auth/apple/callback",
        description="Apple OAuth redirect URI"
    )

    # JWT Configuration
    jwt_issuer: str = Field("expense-tracker", description="JWT issuer claim")
    jwt_audience: str = Field("expense-tracker-users", description="JWT audience claim")

    # Rate Limiting
    rate_limit_requests: int = Field(10, description="Max requests per minute for auth endpoints")
    rate_limit_period_seconds: int = Field(60, description="Rate limit period in seconds")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

    @validator("secret_key")
    def validate_secret_key(cls, v):
        """Ensure SECRET_KEY is not the default placeholder value."""
        if v == "tu_secret_key_aqui_genera_uno_nuevo_para_produccion":
            raise ValueError(
                "SECRET_KEY está usando el valor por defecto. "
                "Genera uno nuevo con: openssl rand -base64 64"
            )
        if len(v) < 32:
            raise ValueError(
                f"SECRET_KEY debe tener al menos 32 caracteres. Actual: {len(v)}"
            )
        return v

    @validator("token_expiration_minutes")
    def validate_token_expiration(cls, v):
        """Ensure token expiration is reasonable."""
        if v < 5:
            raise ValueError("TOKEN_EXPIRATION debe ser al menos 5 minutos")
        if v > 1440:  # 24 hours
            raise ValueError("TOKEN_EXPIRATION no debe exceder 1440 minutos (24 horas)")
        return v

    def get_database_url(self) -> str:
        """
        Get SQLAlchemy database URL.

        Uses DATABASE_URL if available, otherwise builds from components.
        """
        if self.database_url:
            # If DATABASE_URL is provided, use it directly
            # Convert postgres:// to postgresql:// for SQLAlchemy if needed
            url = self.database_url
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url

        # Legacy support: build from individual components (MySQL)
        if self.db_user and self.db_pass and self.db_host and self.db_name:
            port = self.db_port or 3306
            return f"mysql+pymysql://{self.db_user}:{self.db_pass}@{self.db_host}:{port}/{self.db_name}"

        raise ValueError(
            "DATABASE_URL environment variable is required. "
            "Or provide db_user, db_pass, db_host, and db_name."
        )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the application settings instance."""
    return settings
