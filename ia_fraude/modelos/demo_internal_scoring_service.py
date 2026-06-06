from __future__ import annotations

from dataclasses import asdict, dataclass
from math import isfinite
from typing import Any

from ia_fraude.modelos.predictor_fraude import obtener_info_modelo, predecir_caso_structurado


class DemoScoringServiceError(RuntimeError):
    pass


@dataclass(slots=True)
class DemoScoringRequest:
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
    credit_score: int

    def to_payload(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class DemoScoringResponse:
    score: float
    risk_class: str
    confidence: float
    top_factors: list[dict[str, Any]]
    model_name: str
    model_version: str
    raw_prediction: dict[str, Any]


class DemoInternalScoringService:
    def predict(self, request: DemoScoringRequest) -> DemoScoringResponse:
        payload = request.to_payload()
        self._validate_request(payload)

        try:
            prediction = predecir_caso_structurado(payload)
        except Exception as exc:  # pragma: no cover - defensive wrapper
            raise DemoScoringServiceError("No se pudo ejecutar el scoring demo interno.") from exc

        return self._parse_prediction(prediction)

    def model_info(self) -> dict[str, Any]:
        try:
            return obtener_info_modelo()
        except Exception as exc:  # pragma: no cover - defensive wrapper
            raise DemoScoringServiceError("No se pudo obtener la metadata del modelo demo.") from exc

    def _validate_request(self, payload: dict[str, Any]) -> None:
        numeric_features = {
            "monto_reclamado",
            "cantidad_siniestros_previos",
            "debt_ratio",
            "bounced_checks",
            "antiguedad_como_cliente_meses",
            "credit_score",
        }
        for feature in numeric_features:
            value = payload[feature]
            if not isinstance(value, (int, float)) or not isfinite(float(value)):
                raise DemoScoringServiceError(f"Feature invalida para scoring demo: {feature}.")

    def _parse_prediction(self, prediction: dict[str, Any]) -> DemoScoringResponse:
        required_keys = {"score", "riskClass", "confidence", "topFactors", "modelName", "modelVersion"}
        missing = required_keys.difference(prediction)
        if missing:
            raise DemoScoringServiceError(f"Respuesta invalida del scoring demo: faltan {sorted(missing)}.")

        return DemoScoringResponse(
            score=float(prediction["score"]),
            risk_class=str(prediction["riskClass"]),
            confidence=float(prediction["confidence"]),
            top_factors=list(prediction.get("topFactors", [])),
            model_name=str(prediction["modelName"]),
            model_version=str(prediction["modelVersion"]),
            raw_prediction=prediction,
        )
