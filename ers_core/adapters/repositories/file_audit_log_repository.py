from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from ers_core.domain.enums import AuditActionType, AuditResultType
from ers_core.domain.models import AuditLog


class FileAuditLogRepository:
    def __init__(self, file_path: str | Path) -> None:
        self._file_path = Path(file_path)
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._file_path.exists():
            self._file_path.write_text("", encoding="utf-8")

    def append(self, audit_log: AuditLog) -> None:
        payload = asdict(audit_log)
        payload["action"] = audit_log.action.value
        payload["result"] = audit_log.result.value
        payload["timestamp"] = audit_log.timestamp.isoformat()
        with self._file_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")

    def query(
        self,
        *,
        actor_id: str | None = None,
        actor_role: str | None = None,
        entity_id: str | None = None,
        action: str | None = None,
        result: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        page: int = 0,
        page_size: int = 20,
        sort_by: str = "timestamp",
        sort_direction: str = "desc",
    ) -> tuple[list[AuditLog], int]:
        rows = self._load()

        if actor_id:
            rows = [row for row in rows if actor_id.lower() in str(row.get("actor_id", "")).lower()]
        if actor_role:
            rows = [row for row in rows if str(row.get("actor_role", "")).lower() == actor_role.lower()]
        if entity_id:
            rows = [row for row in rows if str(row.get("entity_id", "")).lower() == entity_id.lower()]
        if action:
            rows = [row for row in rows if str(row.get("action", "")).lower() == action.lower()]
        if result:
            rows = [row for row in rows if str(row.get("result", "")).lower() == result.lower()]
        if date_from:
            rows = [row for row in rows if str(row.get("timestamp", ""))[:10] >= date_from]
        if date_to:
            rows = [row for row in rows if str(row.get("timestamp", ""))[:10] <= date_to]

        reverse = sort_direction.lower() == "desc"
        rows.sort(key=lambda row: str(row.get(sort_by, "")), reverse=reverse)

        total = len(rows)
        start = max(0, page) * max(1, page_size)
        paged = rows[start : start + max(1, page_size)]
        return ([self._deserialize(item) for item in paged], total)

    def _load(self) -> list[dict]:
        raw = self._file_path.read_text(encoding="utf-8")
        return [json.loads(line) for line in raw.splitlines() if line.strip()]

    def _deserialize(self, row: dict) -> AuditLog:
        return AuditLog(
            audit_id=row["audit_id"],
            action=AuditActionType(row["action"]),
            result=AuditResultType(row["result"]),
            entity_type=row["entity_type"],
            entity_id=row["entity_id"],
            actor_id=row.get("actor_id"),
            actor_role=row.get("actor_role"),
            correlation_id=row.get("correlation_id"),
            timestamp=datetime.fromisoformat(row["timestamp"]),
            detail=row.get("detail", ""),
            metadata=row.get("metadata", {}),
        )
