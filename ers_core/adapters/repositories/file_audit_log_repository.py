from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

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
