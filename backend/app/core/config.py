from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Smart Budget Allocator"
    environment: str = "development"
    database_url: str = "sqlite:///./smart_budget.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"  # Use CORS_ORIGINS=* for quick deployment, or set your Vercel URL in production.

    google_sheets_enabled: bool = False
    google_service_account_file: str = "./google_service_account.json"
    google_sheet_id: str = ""
    google_sheet_range: str = "Budget!A1:Z1000"

    class Config:
        env_file = "../.env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
