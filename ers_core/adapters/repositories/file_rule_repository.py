from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from ers_core.domain.models import ConfiguredRule


class FileRuleConfigRepository:
    def __init__(self, file_path: str | Path) -> None:
        self._file_path = Path(file_path)
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._file_path.exists():
            self._file_path.write_text("[]", encoding="utf-8")

    def list_all(self) -> list[ConfiguredRule]:
        return [self._deserialize(item) for item in self._load()]

    def get_by_id(self, rule_id: str) -> ConfiguredRule | None:
        for item in self.list_all():
            if item.rule_id == rule_id:
                return item
        return None

    def save(self, rule: ConfiguredRule) -> ConfiguredRule:
        rows = self._load()
        serialized = self._serialize(rule)
        for index, row in enumerate(rows):
            if row["rule_id"] == rule.rule_id:
                rows[index] = serialized
                self._save(rows)
                return rule
        rows.append(serialized)
        self._save(rows)
        return rule

    def _load(self) -> list[dict]:
        raw = self._file_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)

    def _save(self, rows: list[dict]) -> None:
        self._file_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    def _serialize(self, rule: ConfiguredRule) -> dict:
        payload = asdict(rule)
        payload["created_at"] = rule.created_at.isoformat()
        payload["updated_at"] = rule.updated_at.isoformat()
        return payload

    def _deserialize(self, row: dict) -> ConfiguredRule:
        return ConfiguredRule(
            rule_id=row["rule_id"],
            name=row["name"],
            category=row["category"],
            severity=row["severity"],
            status=row["status"],
            source=row.get("source"),
            description=row.get("description", ""),
            rule_type=row.get("rule_type", ""),
            parameters=row.get("parameters", {}),
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
            updated_by=row.get("updated_by"),
        )
