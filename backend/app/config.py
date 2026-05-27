from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_path: str = str(Path(__file__).parent.parent / "statlens.db")
    upload_dir: str = str(Path(__file__).parent.parent / "uploads")
    max_file_size_mb: int = 100
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {"env_prefix": "STATLENS_"}


settings = Settings()
