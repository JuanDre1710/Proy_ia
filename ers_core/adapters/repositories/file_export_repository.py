from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from ers_core.domain.models import ExportRecord


class FileExportRepository:
    def __init__(self, index_path: str | Path, storage_dir: str | Path) -> None:
        self._index_path = Path(index_path)
        self._storage_dir = Path(storage_dir)
        self._index_path.parent.mkdir(parents=True, exist_ok=True)
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        if not self._index_path.exists():
            self._index_path.write_text("[]", encoding="utf-8")

    def save(self, export_record: ExportRecord) -> ExportRecord:
        rows = self._load()
        serialized = asdict(export_record)
        serialized["created_at"] = export_record.created_at.isoformat()
        for index, row in enumerate(rows):
            if row["export_id"] == export_record.export_id:
                rows[index] = serialized
                self._save(rows)
                return export_record
        rows.append(serialized)
        self._save(rows)
        return export_record

    def get_by_id(self, export_id: str) -> ExportRecord | None:
        for row in self._load():
            if row["export_id"] == export_id:
                return self._deserialize(row)
        return None

    def storage_path_for(self, filename: str) -> Path:
        return self._storage_dir / filename

    def _load(self) -> list[dict]:
        raw = self._index_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)

    def _save(self, rows: list[dict]) -> None:
        self._index_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    def _deserialize(self, row: dict) -> ExportRecord:
        return ExportRecord(
            export_id=row["export_id"],
            case_id=row["case_id"],
            format=row["format"],
            filename=row["filename"],
            file_path=row["file_path"],
            content_type=row["content_type"],
            size_bytes=row["size_bytes"],
            created_at=datetime.fromisoformat(row["created_at"]),
            created_by_id=row.get("created_by_id"),
            created_by_name=row.get("created_by_name"),
            created_by_role=row.get("created_by_role"),
            status=row.get("status", "READY"),
            metadata=row.get("metadata", {}),
        )
