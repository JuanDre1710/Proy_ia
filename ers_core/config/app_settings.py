from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True, slots=True)
class AppSettings:
    env: str
    data_dir: Path
    export_dir: Path
    cors_origins: list[str]
    jwt_secret: str
    rate_limit_window_seconds: int
    rate_limit_requests: int
    log_level: str
    structured_logs: bool
    enable_model_watcher: bool
    app_name: str
    app_version: str
    identity_data_provider: str
    active_claim_status_codes: tuple[str, ...]
    enterprise_sqlserver_connection_string: str | None

    @property
    def is_production(self) -> bool:
        return self.env.lower() in {"prod", "production"}

    def validate(self) -> None:
        if self.is_production and self.jwt_secret == "ers-dev-secret-change-me":
            raise RuntimeError("ERS_JWT_SECRET must be configured in production.")


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    origins_raw = os.getenv("ERS_CORS_ORIGINS", "http://localhost:4200,http://localhost:5173")
    active_claim_statuses_raw = os.getenv("ERS_ACTIVE_CLAIM_STATUS_CODES", "OPEN,IN_REVIEW,PENDING_ANALYSIS")
    settings = AppSettings(
        env=os.getenv("ERS_ENV", "dev"),
        data_dir=Path(os.getenv("ERS_DATA_DIR", "data")),
        export_dir=Path(os.getenv("ERS_EXPORT_DIR", str(Path(os.getenv("ERS_DATA_DIR", "data")) / "exports" / "files"))),
        cors_origins=[item.strip() for item in origins_raw.split(",") if item.strip()],
        jwt_secret=os.getenv("ERS_JWT_SECRET", "ers-dev-secret-change-me"),
        rate_limit_window_seconds=int(os.getenv("ERS_RATE_LIMIT_WINDOW_SECONDS", "60")),
        rate_limit_requests=int(os.getenv("ERS_RATE_LIMIT_REQUESTS", "120")),
        log_level=os.getenv("ERS_LOG_LEVEL", "INFO").upper(),
        structured_logs=os.getenv("ERS_STRUCTURED_LOGS", "true").lower() != "false",
        enable_model_watcher=os.getenv("ERS_ENABLE_MODEL_WATCHER", "true").lower() != "false",
        app_name=os.getenv("ERS_APP_NAME", "ERS - IA Microservicio River"),
        app_version=os.getenv("ERS_APP_VERSION", "1.0"),
        identity_data_provider=os.getenv("ERS_IDENTITY_DATA_PROVIDER", "demo").strip().lower(),
        active_claim_status_codes=tuple(
            item.strip().upper() for item in active_claim_statuses_raw.split(",") if item.strip()
        ),
        enterprise_sqlserver_connection_string=os.getenv("ERS_ENTERPRISE_SQLSERVER_CONNECTION_STRING") or None,
    )
    settings.validate()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.export_dir.mkdir(parents=True, exist_ok=True)
    return settings


def reset_settings_cache() -> None:
    get_settings.cache_clear()
