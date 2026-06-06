from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from ers_core.application.ports.auth_repository import RefreshTokenRecord


class FileRefreshTokenRepository:
    def __init__(self, file_path: str | Path) -> None:
        self._file_path = Path(file_path)
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._file_path.exists():
            self._file_path.write_text("[]", encoding="utf-8")

    def save(self, token: RefreshTokenRecord) -> RefreshTokenRecord:
        rows = self._load()
        serialized = asdict(token)
        for index, row in enumerate(rows):
            if row["token_id"] == token.token_id:
                rows[index] = serialized
                self._save(rows)
                return token
        rows.append(serialized)
        self._save(rows)
        return token

    def get_active(self, token_hash: str) -> RefreshTokenRecord | None:
        for row in self._load():
            if row["token_hash"] == token_hash and not row.get("revoked_at"):
                return RefreshTokenRecord(**row)
        return None

    def revoke(self, token_hash: str, reason: str) -> None:
        rows = self._load()
        changed = False
        for row in rows:
            if row["token_hash"] == token_hash and not row.get("revoked_at"):
                row["revoked_at"] = __import__("datetime").datetime.utcnow().isoformat()
                row["revoked_reason"] = reason
                changed = True
        if changed:
            self._save(rows)

    def _load(self) -> list[dict]:
        raw = self._file_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)

    def _save(self, rows: list[dict]) -> None:
        self._file_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

