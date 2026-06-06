from __future__ import annotations

from fastapi import APIRouter

from ers_core.application.services.tabular_scoring_service import ScoringFeatures, TabularScoringService
from .scoring_schemas import ScoringPredictRequestDto, ScoringPredictResponseDto

router = APIRouter(tags=["scoring"])
_scoring_service = TabularScoringService()


@router.post("/predict", response_model=ScoringPredictResponseDto)
def predict(payload: ScoringPredictRequestDto) -> ScoringPredictResponseDto:
    result = _scoring_service.predict(
        ScoringFeatures(
            monto_reclamado=payload.monto_reclamado,
            cantidad_siniestros_previos=payload.cantidad_siniestros_previos,
            debt_ratio=payload.debt_ratio,
            bounced_checks=payload.bounced_checks,
            antiguedad_como_cliente_meses=payload.antiguedad_como_cliente_meses,
            zona_de_riesgo=payload.zona_de_riesgo,
            imagenes_sospechosas=payload.imagenes_sospechosas,
            telefono_repetido_con_otro_cliente=payload.telefono_repetido_con_otro_cliente,
            proveedor_repetido=payload.proveedor_repetido,
            historial_fraude_confirmado=payload.historial_fraude_confirmado,
            credit_score=payload.credit_score,
        )
    )
    return ScoringPredictResponseDto(**result)


@router.get("/model/info")
def model_info() -> dict:
    return _scoring_service.model_info()
