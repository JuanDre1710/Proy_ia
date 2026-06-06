from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from ers_core.application.ports.auth_repository import AuthUserRecord
from ers_core.security.passwords import hash_password


class FileAuthUserRepository:
    def __init__(self, file_path: str | Path) -> None:
        self._file_path = Path(file_path)
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._file_path.exists():
            self._seed_defaults()

    def get_by_username(self, username: str) -> AuthUserRecord | None:
        normalized = username.strip().lower()
        for user in self._load():
            if user["username"].lower() == normalized:
                return self._deserialize(user)
        return None

    def get_by_id(self, user_id: str) -> AuthUserRecord | None:
        for user in self._load():
            if user["user_id"] == user_id:
                return self._deserialize(user)
        return None

    def upsert(self, user: AuthUserRecord) -> AuthUserRecord:
        rows = self._load()
        serialized = asdict(user)
        for index, row in enumerate(rows):
            if row["user_id"] == user.user_id:
                rows[index] = serialized
                self._save(rows)
                return user
        rows.append(serialized)
        self._save(rows)
        return user

    def _load(self) -> list[dict]:
        raw = self._file_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)

    def _save(self, rows: list[dict]) -> None:
        self._file_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    def _deserialize(self, row: dict) -> AuthUserRecord:
        return AuthUserRecord(**row)

    def _seed_defaults(self) -> None:
        defaults = [
            AuthUserRecord(
                user_id="usr-admin",
                username="admin",
                password_hash=hash_password("Admin#123"),
                name="Laura Mendez",
                email="laura.mendez@ers.local",
                role="Admin",
                last_login="2026-03-13T08:15:00",
            ),
            AuthUserRecord(
                user_id="usr-eval",
                username="evaluador",
                password_hash=hash_password("Eval#123"),
                name="Julian Acosta",
                email="julian.acosta@ers.local",
                role="Evaluador",
                last_login="2026-03-13T07:55:00",
            ),
            AuthUserRecord(
                user_id="usr-supervisor",
                username="supervisor",
                password_hash=hash_password("Super#123"),
                name="Carla Sosa",
                email="carla.sosa@ers.local",
                role="Supervisor",
                last_login="2026-03-12T18:40:00",
            ),
        ]
        self._save([asdict(user) for user in defaults])

