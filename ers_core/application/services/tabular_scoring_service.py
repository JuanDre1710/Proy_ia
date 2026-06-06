from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ers_core.domain.enums import RiskCategory
from ers_core.domain.models import Case, ScoreResult
from ia_fraude.modelos.demo_internal_scoring_service import (
    DemoInternalScoringService,
    DemoScoringRequest,
    DemoScoringServiceError,
)

try:
    from ia_fraude.modelos.predictor_fraude import obtener_info_modelo, predecir_caso_structurado
except Exception:  # pragma: no cover - fallback when model dependencies are missing
    obtener_info_modelo = None
    predecir_caso_structurado = None


@dataclass(slots=True)
class ScoringFeatures:
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
    quality_flags: dict[str, Any] = field(default_factory=dict)


class TabularScoringService:
    def __init__(self, scoring_service: DemoInternalScoringService | None = None) -> None:
        self._scoring_service = scoring_service or DemoInternalScoringService()

    def build_features(self, case: Case) -> ScoringFeatures:
        debt_ratio = float(case.financial_info.debt_ratio or 0)
        bounced_checks = int(case.financial_info.bounced_checks or 0)
        credit_score = int(case.financial_info.credit_score or 0) if case.financial_info else 0
        previous_claims = int(case.metadata.get("previousClaimsCount", case.financial_info.attributes.get("previousClaims", 0))) if case.financial_info else int(case.metadata.get("previousClaimsCount", 0))
        recent_customer_months = int(case.metadata.get("customerAntiquityMonths", 2 if debt_ratio > 0.55 else 24))
        provider_statuses = case.consolidated_evidence.provider_statuses if case.consolidated_evidence else {}
        hard_rule_codes = [item.code for item in case.hard_rule_evaluation.findings] if case.hard_rule_evaluation else []
        claim_amount = float(case.metadata.get("claimAmount", 95000 + previous_claims * 12000 + bounced_checks * 5000))
        high_risk_zone = bool(case.metadata.get("highRiskZone", bool(case.subject.province and case.subject.province.lower() in {"mendoza", "neuquen"})))
        suspicious_images = bool(case.metadata.get("suspiciousImages", "CRITICAL_CROSS_SOURCE_INCONSISTENCY" in hard_rule_codes))
        shared_phone_flag = bool(case.metadata.get("sharedPhoneFlag", bool(case.identity_status.inconsistencies)))
        repeated_provider_flag = bool(case.metadata.get("repeatedProviderFlag", provider_statuses.get("FINANCIAL") == "partial"))
        confirmed_fraud_history = bool(case.metadata.get("confirmedFraudHistory", "POLICY_BLOCK" in hard_rule_codes))

        return ScoringFeatures(
            monto_reclamado=claim_amount,
            cantidad_siniestros_previos=previous_claims,
            debt_ratio=debt_ratio,
            bounced_checks=bounced_checks,
            antiguedad_como_cliente_meses=recent_customer_months,
            zona_de_riesgo=high_risk_zone,
            imagenes_sospechosas=suspicious_images,
            telefono_repetido_con_otro_cliente=shared_phone_flag,
            proveedor_repetido=repeated_provider_flag,
            historial_fraude_confirmado=confirmed_fraud_history,
            credit_score=credit_score,
            quality_flags={
                "identity_quality": case.identity_status.quality_score,
                "financial_quality": case.financial_info.quality_score if case.financial_info else None,
                "evidence_count": len(case.evidences),
            },
        )

    def build_request(self, features: ScoringFeatures) -> DemoScoringRequest:
        return DemoScoringRequest(
            monto_reclamado=features.monto_reclamado,
            cantidad_siniestros_previos=features.cantidad_siniestros_previos,
            debt_ratio=features.debt_ratio,
            bounced_checks=features.bounced_checks,
            antiguedad_como_cliente_meses=features.antiguedad_como_cliente_meses,
            zona_de_riesgo=features.zona_de_riesgo,
            imagenes_sospechosas=features.imagenes_sospechosas,
            telefono_repetido_con_otro_cliente=features.telefono_repetido_con_otro_cliente,
            proveedor_repetido=features.proveedor_repetido,
            historial_fraude_confirmado=features.historial_fraude_confirmado,
            credit_score=features.credit_score,
        )

    def predict(self, features: ScoringFeatures) -> dict[str, Any]:
        request = self.build_request(features)
        payload = request.to_payload()
        try:
            response = self._scoring_service.predict(request)
            return response.raw_prediction
        except DemoScoringServiceError:
            pass
        return self._heuristic_predict(payload)

    def model_info(self) -> dict[str, Any]:
        try:
            return self._scoring_service.model_info()
        except DemoScoringServiceError:
            pass
        if obtener_info_modelo is not None:
            return obtener_info_modelo()
        return {
            "modelo_class": "HeuristicFallback",
            "metadata": {
                "accuracy": "fallback",
                "descripcion": "Modelo heuristico usado porque no se pudo cargar River en este entorno",
            },
        }

    def score_case(self, case: Case) -> ScoreResult:
        features = self.build_features(case)
        prediction = self.predict(features)
        return ScoreResult(
            score_id=f"SCORE-{case.case_id}",
            model_name=str(prediction["modelName"]),
            model_version=str(prediction["modelVersion"]),
            score_value=float(prediction["score"]),
            risk_category=self._map_risk_class(str(prediction["riskClass"])),
            confidence=float(prediction["confidence"]),
            top_factors=list(prediction["topFactors"]),
            feature_contributions={
                item["feature"]: float(item.get("weight", 0)) * 100
                for item in prediction["topFactors"]
            },
            metadata={"qualityFlags": features.quality_flags},
        )

    def _heuristic_predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        score = 15.0
        factors: list[dict[str, Any]] = []
        if payload["cantidad_siniestros_previos"] >= 3:
            score += 20
            factors.append({"feature": "cantidad_siniestros_previos", "label": "cantidad siniestros previos", "impact": "Reincidencia", "weight": 0.9})
        if payload["zona_de_riesgo"]:
            score += 18
            factors.append({"feature": "zona_de_riesgo", "label": "zona de riesgo", "impact": "Alerta de riesgo", "weight": 0.8})
        if payload["imagenes_sospechosas"]:
            score += 16
            factors.append({"feature": "imagenes_sospechosas", "label": "imagenes sospechosas", "impact": "Senal visual anomala", "weight": 0.78})
        if payload["telefono_repetido_con_otro_cliente"]:
            score += 12
            factors.append({"feature": "telefono_repetido_con_otro_cliente", "label": "telefono repetido con otro cliente", "impact": "Contacto compartido", "weight": 0.64})
        if payload["historial_fraude_confirmado"]:
            score += 25
            factors.append({"feature": "historial_fraude_confirmado", "label": "historial fraude confirmado", "impact": "Politica bloqueante", "weight": 0.95})
        score = min(score, 99.0)
        risk_class = "Sospechoso de fraude" if score >= 66 else "Requiere revisión" if score >= 33 else "Normal"
        return {
            "score": score,
            "riskClass": risk_class,
            "topFactors": factors or [{"feature": "baseline", "label": "baseline", "impact": "Sin factores destacados", "weight": 0.0}],
            "confidence": min(abs(score / 100 - 0.5) * 2, 1.0),
            "modelVersion": "heuristic-fallback",
            "modelName": "HeuristicFallback",
        }

    def _map_risk_class(self, value: str) -> RiskCategory:
        normalized = value.lower()
        if "sospech" in normalized:
            return RiskCategory.FRAUD_SUSPECT
        if "revision" in normalized or "requiere" in normalized:
            return RiskCategory.REQUIRES_REVIEW
        return RiskCategory.NORMAL
