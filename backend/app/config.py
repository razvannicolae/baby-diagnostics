from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "postgresql+asyncpg://babybio:babybio_dev@localhost:5432/babybio"

    # Auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60
    google_client_id: str = ""

    # Field Encryption
    field_encryption_key: str = ""

    # LLM
    anthropic_api_key: str = ""
    llm_provider: str = "anthropic"          # "anthropic" | "lmstudio"
    lmstudio_base_url: str = "http://127.0.0.1:1234"
    lmstudio_api_key: str = ""               # optional — only if auth is enabled in LM Studio
    lmstudio_model: str = "qwen3.6"          # model name as shown in LM Studio

    # CV
    calibration_path: str = "app/cv/calibration/default.yaml"

    # App
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()  # type: ignore[call-arg]
