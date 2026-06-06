from __future__ import annotations

from pydantic import BaseModel


class CaseExportResponseDto(BaseModel):
    exportId: str
    filename: str
    format: str
    status: str
    downloadUrl: str
    createdAt: str
