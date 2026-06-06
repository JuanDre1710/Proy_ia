from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from ers_core.domain.enums import IntegrationStatus, ProviderType
from ers_core.domain.models import IntegrationConfig


class FileIntegrationConfigRepository:
    def __init__(self, file_path: str | Path) -> None:
        self._file_path = Path(file_path)
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._file_path.exists():
            self._file_path.write_text("[]", encoding="utf-8")

    def list_all(self) -> list[IntegrationConfig]:
        return [self._deserialize(item) for item in self._load()]

    def get_by_id(self, integration_id: str) -> IntegrationConfig | None:
        for item in self.list_all():
            if item.integration_id == integration_id:
                return item
        return None

    def save(self, integration: IntegrationConfig) -> IntegrationConfig:
        rows = self._load()
        serialized = self._serialize(integration)
        for index, row in enumerate(rows):
            if row["integration_id"] == integration.integration_id:
                rows[index] = serialized
                self._save(rows)
                return integration
        rows.append(serialized)
        self._save(rows)
        return integration

    def delete(self, integration_id: str) -> bool:
        rows = self._load()
        filtered = [row for row in rows if row["integration_id"] != integration_id]
        if len(filtered) == len(rows):
            return False
        self._save(filtered)
        return True

    def _load(self) -> list[dict]:
        raw = self._file_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)

    def _save(self, rows: list[dict]) -> None:
        self._file_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    def _serialize(self, integration: IntegrationConfig) -> dict:
        payload = asdict(integration)
        payload["provider_type"] = integration.provider_type.value
        payload["status"] = integration.status.value
        payload["updated_at"] = integration.updated_at.isoformat()
        return payload

    def _deserialize(self, row: dict) -> IntegrationConfig:
        return IntegrationConfig(
            integration_id=row["integration_id"],
            provider_type=ProviderType(row["provider_type"]),
            provider_code=row["provider_code"],
            display_name=row["display_name"],
            status=IntegrationStatus(row["status"]),
            enabled=row["enabled"],
            base_url=row.get("base_url"),
            auth_type=row.get("auth_type"),
            secret_ref=row.get("secret_ref"),
            timeout_ms=row.get("timeout_ms", 5000),
            retries=row.get("retries", 0),
            retry_policy=row.get("retry_policy", {}),
            mapping_profile=row.get("mapping_profile"),
            settings=row.get("settings", {}),
            metadata=row.get("metadata", {}),
            updated_at=datetime.fromisoformat(row["updated_at"]),
            updated_by=row.get("updated_by"),
        )

