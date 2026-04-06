from __future__ import annotations

from pydantic import BaseModel, Field


class ScoringPredictRequestDto(BaseModel):
    monto_reclamado: float
    cantidad_siniestros_previos: int
    debt_ratio: float
    bounced_checks: int
    antiguedad_como_cliente_meses: int
    zona_de_riesgo: bool
    imagenes_sospechosas: bool
    telefono_repetido_con_otro_cliente: bool
    proveedor_repetido: bool
    historial_fraude_confirmado: bool
    credit_score: int = Field(default=0, ge=0, le=1000)


class ScoringTopFactorDto(BaseModel):
    feature: str
    label: str
    impact: str
    weight: float


class ScoringPredictResponseDto(BaseModel):
    score: float
    riskClass: str
    topFactors: list[ScoringTopFactorDto] = Field(default_factory=list)
    confidence: float
    modelVersion: str
    modelName: str
