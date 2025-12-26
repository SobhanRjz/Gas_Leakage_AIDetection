"""
Core configuration for the FastAPI application
"""
import os
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    # Application settings
    PROJECT_NAME: str = "Pipeline Leakage Detection System"
    API_V1_STR: str = "/api/v1"

    # Security settings
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    # Database settings
    DATABASE_URL: str = Field(default="sqlite:///./pipeline_leakage.db")

    # OpenAI Chat settings
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_MODEL: str = Field(default="gpt-4.1-nano")
    OPENAI_API_URL: str = Field(default="https://api.openai.com/v1/chat/completions")
    OPENAI_TEMPERATURE: float = Field(default=0.7)

    # CORS settings - computed field, not from env
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173").split(",")

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields from .env
    )


settings = Settings()
