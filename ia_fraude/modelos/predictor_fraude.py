from __future__ import annotations

import pickle
from typing import Any

from .demo_scoring_baseline import (
    FEATURE_LABELS,
    FEATURE_NAMES,
    LEGACY_MODEL_INFO_PATH,
    LEGACY_MODEL_PATH,
    MODEL_INFO_PATH,
    MODEL_PATH,
    classify_risk,
    feature_frame_from_payload,
    load_model_metadata,
    normalize_payload,
)

_MODEL_BUNDLE: dict[str, Any] | None = None
_MODEL_INFO: dict[str, Any] | None = None


def _load_model_bundle() -> tuple[dict[str, Any] | None, dict[str, Any]]:
    global _MODEL_BUNDLE, _MODEL_INFO
    if _MODEL_INFO is not None:
        return _MODEL_BUNDLE, _MODEL_INFO

    if MODEL_PATH.exists() and MODEL_INFO_PATH.exists():
        with MODEL_PATH.open("rb") as file_handle:
            _MODEL_BUNDLE = pickle.load(file_handle)
        _MODEL_INFO = load_model_metadata()
        return _MODEL_BUNDLE, _MODEL_INFO

    if LEGACY_MODEL_PATH.exists() and LEGACY_MODEL_INFO_PATH.exists():
        with LEGACY_MODEL_PATH.open("rb") as file_handle:
            _MODEL_BUNDLE = {"legacy_model": pickle.load(file_handle)}
        _MODEL_INFO = load_model_metadata()
        return _MODEL_BUNDLE, _MODEL_INFO

    _MODEL_BUNDLE = None
    _MODEL_INFO = load_model_metadata()
    return _MODEL_BUNDLE, _MODEL_INFO


def clasificar_fraude(prob: float) -> str:
    return classify_risk(probability=float(prob))


def calcular_impacto(variable: str, valor: Any) -> str:
    reglas_alerta = {
        "zona_de_riesgo": lambda v: "Alerta geografica" if bool(v) else None,
        "imagenes_sospechosas": lambda v: "Senal documental anomala" if bool(v) else None,
        "proveedor_repetido": lambda v: "Evidencia parcial o repetida" if bool(v) else None,
        "telefono_repetido_con_otro_cliente": lambda v: "Contacto compartido" if bool(v) else None,
        "historial_fraude_confirmado": lambda v: "Historial de fraude confirmado" if bool(v) else None,
        "antiguedad_como_cliente_meses": lambda v: "Cliente reciente" if isinstance(v, (int, float)) and v < 6 else None,
        "monto_reclamado": lambda v: "Monto elevado" if isinstance(v, (int, float)) and v > 180000 else None,
        "cantidad_siniestros_previos": lambda v: "Reincidencia" if isinstance(v, (int, float)) and v >= 2 else None,
        "debt_ratio": lambda v: "Presion financiera" if isinstance(v, (int, float)) and v >= 0.45 else None,
        "bounced_checks": lambda v: "Cheques rechazados" if isinstance(v, (int, float)) and v > 0 else None,
        "credit_score": lambda v: "Score crediticio bajo" if isinstance(v, (int, float)) and v < 500 else None,
    }
    regla = reglas_alerta.get(variable)
    if regla is None:
        return "Normal"
    return regla(valor) or "Normal"


def _heuristic_predict(input_dict: dict[str, Any], model_info: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_payload(input_dict)
    score = 12.0
    factors: list[dict[str, Any]] = []

    if normalized["cantidad_siniestros_previos"] >= 2:
        score += 18
        factors.append({"feature": "cantidad_siniestros_previos", "label": FEATURE_LABELS["cantidad_siniestros_previos"], "impact": "Reincidencia", "weight": 0.82})
    if normalized["debt_ratio"] >= 0.45:
        score += 16
        factors.append({"feature": "debt_ratio", "label": FEATURE_LABELS["debt_ratio"], "impact": "Presion financiera", "weight": 0.76})
    if normalized["bounced_checks"] > 0:
        score += 14
        factors.append({"feature": "bounced_checks", "label": FEATURE_LABELS["bounced_checks"], "impact": "Cheques rechazados", "weight": 0.72})
    if normalized["zona_de_riesgo"]:
        score += 12
        factors.append({"feature": "zona_de_riesgo", "label": FEATURE_LABELS["zona_de_riesgo"], "impact": "Alerta geografica", "weight": 0.64})
    if normalized["imagenes_sospechosas"]:
        score += 12
        factors.append({"feature": "imagenes_sospechosas", "label": FEATURE_LABELS["imagenes_sospechosas"], "impact": "Senal documental anomala", "weight": 0.61})
    if normalized["telefono_repetido_con_otro_cliente"]:
        score += 10
        factors.append({"feature": "telefono_repetido_con_otro_cliente", "label": FEATURE_LABELS["telefono_repetido_con_otro_cliente"], "impact": "Contacto compartido", "weight": 0.58})
    if normalized["proveedor_repetido"]:
        score += 8
        factors.append({"feature": "proveedor_repetido", "label": FEATURE_LABELS["proveedor_repetido"], "impact": "Proveedor repetido o parcial", "weight": 0.52})
    if normalized["historial_fraude_confirmado"]:
        score += 20
        factors.append({"feature": "historial_fraude_confirmado", "label": FEATURE_LABELS["historial_fraude_confirmado"], "impact": "Historial confirmado", "weight": 0.9})
    if normalized["credit_score"] and normalized["credit_score"] < 500:
        score += 8
        factors.append({"feature": "credit_score", "label": FEATURE_LABELS["credit_score"], "impact": "Score crediticio bajo", "weight": 0.48})

    score = min(score, 99.0)
    probability = round(score / 100, 4)
    return {
        "score": score,
        "riskClass": clasificar_fraude(probability),
        "topFactors": factors or [{"feature": "baseline", "label": "baseline", "impact": "Sin factores destacados", "weight": 0.0}],
        "confidence": round(min(abs(probability - 0.5) * 2, 1.0), 4),
        "modelVersion": str(model_info.get("metadata", {}).get("version", "heuristic-fallback")),
        "modelName": model_info.get("modelo_class", "HeuristicFallback"),
    }


def _top_factors_from_sklearn(bundle: dict[str, Any], input_dict: dict[str, Any]) -> list[dict[str, Any]]:
    pipeline = bundle["pipeline"]
    frame = feature_frame_from_payload(input_dict)
    scaler = pipeline.named_steps["scaler"]
    classifier = pipeline.named_steps["classifier"]
    scaled = scaler.transform(frame)[0]
    coefficients = classifier.coef_[0]
    contributions = scaled * coefficients
    ranked = sorted(
        [(feature, float(contribution), input_dict[feature]) for feature, contribution in zip(FEATURE_NAMES, contributions)],
        key=lambda item: abs(item[1]),
        reverse=True,
    )
    total = sum(abs(item[1]) for item in ranked) or 1.0
    top_factors: list[dict[str, Any]] = []
    for feature, contribution, raw_value in ranked[:5]:
        impact = calcular_impacto(feature, raw_value)
        if impact == "Normal":
            impact = "Impulsa riesgo" if contribution > 0 else "Atenua riesgo"
        top_factors.append(
            {
                "feature": feature,
                "label": FEATURE_LABELS.get(feature, feature.replace("_", " ")),
                "impact": impact,
                "weight": round(abs(contribution) / total, 4),
            }
        )
    return top_factors or [{"feature": "baseline", "label": "baseline", "impact": "Sin factores destacados", "weight": 0.0}]


def _predict_with_bundle(bundle: dict[str, Any] | None, model_info: dict[str, Any], input_dict: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_payload(input_dict)
    if bundle is None:
        return _heuristic_predict(normalized, model_info)

    if "pipeline" in bundle:
        frame = feature_frame_from_payload(normalized)
        probability = float(bundle["pipeline"].predict_proba(frame)[0][1])
        thresholds = model_info.get("thresholds", {})
        return {
            "score": round(probability * 100, 2),
            "riskClass": classify_risk(
                probability,
                review_threshold=float(thresholds.get("review", 0.33)),
                fraud_threshold=float(thresholds.get("fraud", 0.66)),
            ),
            "topFactors": _top_factors_from_sklearn(bundle, normalized),
            "confidence": round(min(abs(probability - 0.5) * 2, 1.0), 4),
            "modelVersion": str(model_info.get("metadata", {}).get("version", "demo-tabular-baseline")),
            "modelName": model_info.get("modelo_class", "DemoTabularBaseline"),
        }

    legacy_model = bundle["legacy_model"]
    probability = float(legacy_model.predict_proba_one(normalized).get(1, 0))
    return {
        "score": round(probability * 100, 2),
        "riskClass": clasificar_fraude(probability),
        "topFactors": _heuristic_predict(normalized, model_info)["topFactors"],
        "confidence": round(min(abs(probability - 0.5) * 2, 1.0), 4),
        "modelVersion": str(model_info.get("metadata", {}).get("accuracy", "legacy-river")),
        "modelName": model_info.get("modelo_class", "BaggingClassifier"),
    }


def predecir_caso(input_dict: dict[str, Any]) -> dict[str, Any]:
    bundle, model_info = _load_model_bundle()
    prediction = _predict_with_bundle(bundle, model_info, input_dict)
    return {
        "score": int(round(float(prediction["score"]))),
        "clasificacion": str(prediction["riskClass"]),
        "explicacion": [{"variable": item["feature"], "impacto": item["impact"]} for item in prediction["topFactors"][:3]],
    }


def predecir_caso_structurado(input_dict: dict[str, Any]) -> dict[str, Any]:
    bundle, model_info = _load_model_bundle()
    return _predict_with_bundle(bundle, model_info, input_dict)


def obtener_info_modelo() -> dict[str, Any]:
    _, model_info = _load_model_bundle()
    return model_info
