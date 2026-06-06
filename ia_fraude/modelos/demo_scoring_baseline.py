from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "ml" / "demo_scoring"
MODEL_DIR = REPO_ROOT / "modelo"

TRAIN_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_train_balanced.csv"
VALIDATION_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_validation.csv"
BACKEND_TRAIN_DATASET_PATH = DATA_DIR / "dataset_demo_backend_features_train.csv"
BACKEND_VALIDATION_DATASET_PATH = DATA_DIR / "dataset_demo_backend_features_validation.csv"

MODEL_PATH = MODEL_DIR / "modelo_fraude_demo_tabular.pkl"
MODEL_INFO_PATH = MODEL_DIR / "modelo_fraude_demo_tabular.json"
LEGACY_MODEL_PATH = MODEL_DIR / "modelo_fraude_river.pkl"
LEGACY_MODEL_INFO_PATH = MODEL_DIR / "modelo_fraude_river.json"

TARGET_COLUMN = "fraude"
FEATURE_NAMES = [
    "monto_reclamado",
    "cantidad_siniestros_previos",
    "debt_ratio",
    "bounced_checks",
    "antiguedad_como_cliente_meses",
    "zona_de_riesgo",
    "imagenes_sospechosas",
    "telefono_repetido_con_otro_cliente",
    "proveedor_repetido",
    "historial_fraude_confirmado",
    "credit_score",
]

FEATURE_LABELS = {
    "monto_reclamado": "monto reclamado",
    "cantidad_siniestros_previos": "cantidad de siniestros previos",
    "debt_ratio": "relacion deuda/ingresos",
    "bounced_checks": "cheques rechazados",
    "antiguedad_como_cliente_meses": "antiguedad como cliente",
    "zona_de_riesgo": "zona de riesgo",
    "imagenes_sospechosas": "imagenes sospechosas",
    "telefono_repetido_con_otro_cliente": "telefono repetido con otro cliente",
    "proveedor_repetido": "proveedor repetido o evidencia parcial",
    "historial_fraude_confirmado": "historial de fraude confirmado",
    "credit_score": "score crediticio",
}


def classify_risk(probability: float, review_threshold: float = 0.33, fraud_threshold: float = 0.66) -> str:
    if probability >= fraud_threshold:
        return "Sospechoso de fraude"
    if probability >= review_threshold:
        return "Requiere revision"
    return "Normal"


def normalize_payload(input_dict: dict[str, Any]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    binary_features = {
        "zona_de_riesgo",
        "imagenes_sospechosas",
        "telefono_repetido_con_otro_cliente",
        "proveedor_repetido",
        "historial_fraude_confirmado",
    }
    integer_features = {
        "cantidad_siniestros_previos",
        "bounced_checks",
        "antiguedad_como_cliente_meses",
        "credit_score",
    }
    for feature in FEATURE_NAMES:
        value = input_dict.get(feature, 0)
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "false"}:
                value = lowered == "true"
        if feature in binary_features:
            normalized[feature] = int(bool(value))
        elif feature in integer_features:
            normalized[feature] = int(float(value))
        else:
            normalized[feature] = float(value)
    return normalized


def map_prepared_dataset_to_backend_features(df: pd.DataFrame) -> pd.DataFrame:
    mapped = pd.DataFrame(
        {
            "monto_reclamado": df["monto_reclamado"].astype(float),
            "cantidad_siniestros_previos": df["frecuencia_siniestros_ultimo_anio"].astype(int),
            "debt_ratio": (df["deuda_total"] / (df["ingresos_mensuales"].clip(lower=1) * 12)).clip(lower=0, upper=5).astype(float),
            "bounced_checks": df["cheques_rechazados"].astype(int),
            "antiguedad_como_cliente_meses": df["antiguedad_domicilio_meses"].astype(int),
            "zona_de_riesgo": df["provincia"].isin(["mendoza", "neuquen"]).astype(int),
            "imagenes_sospechosas": ((df["datos_incompletos"] == 1) | (df["inconsistencia_laboral"] == 1)).astype(int),
            "telefono_repetido_con_otro_cliente": df["repite_telefono"].astype(int),
            "proveedor_repetido": ((df["repite_domicilio"] == 1) | (df["cambio_aseguradora_frecuente"] == 1)).astype(int),
            "historial_fraude_confirmado": 0,
            "credit_score": df["score_crediticio"].astype(int),
            TARGET_COLUMN: df[TARGET_COLUMN].astype(int),
        }
    )
    return mapped


def feature_frame_from_payload(input_dict: dict[str, Any]) -> pd.DataFrame:
    normalized = normalize_payload(input_dict)
    return pd.DataFrame([[normalized[feature] for feature in FEATURE_NAMES]], columns=FEATURE_NAMES)


def load_model_metadata() -> dict[str, Any]:
    if MODEL_INFO_PATH.exists():
        return json.loads(MODEL_INFO_PATH.read_text(encoding="utf-8"))
    if LEGACY_MODEL_INFO_PATH.exists():
        return json.loads(LEGACY_MODEL_INFO_PATH.read_text(encoding="utf-8"))
    return {
        "modelo_class": "HeuristicFallback",
        "metadata": {
            "accuracy": "fallback",
            "descripcion": "Sin modelo baseline persistido; se usa fallback heuristico.",
        },
    }
