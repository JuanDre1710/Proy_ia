from __future__ import annotations

import json
import pickle

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from ia_fraude.modelos.demo_scoring_baseline import (
    BACKEND_TRAIN_DATASET_PATH,
    BACKEND_VALIDATION_DATASET_PATH,
    FEATURE_NAMES,
    MODEL_INFO_PATH,
    MODEL_PATH,
    TARGET_COLUMN,
    TRAIN_DATASET_PATH,
    VALIDATION_DATASET_PATH,
    classify_risk,
    map_prepared_dataset_to_backend_features,
)


def main() -> None:
    train_df = map_prepared_dataset_to_backend_features(pd.read_csv(TRAIN_DATASET_PATH))
    validation_df = map_prepared_dataset_to_backend_features(pd.read_csv(VALIDATION_DATASET_PATH))

    train_df.to_csv(BACKEND_TRAIN_DATASET_PATH, index=False)
    validation_df.to_csv(BACKEND_VALIDATION_DATASET_PATH, index=False)

    x_train = train_df[FEATURE_NAMES]
    y_train = train_df[TARGET_COLUMN]
    x_validation = validation_df[FEATURE_NAMES]
    y_validation = validation_df[TARGET_COLUMN]

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)),
        ]
    )
    pipeline.fit(x_train, y_train)

    validation_probabilities = pipeline.predict_proba(x_validation)[:, 1]
    binary_threshold = 0.5
    validation_predictions = (validation_probabilities >= binary_threshold).astype(int)

    metrics = {
        "accuracy": round(float(accuracy_score(y_validation, validation_predictions)), 6),
        "precision": round(float(precision_score(y_validation, validation_predictions, zero_division=0)), 6),
        "recall": round(float(recall_score(y_validation, validation_predictions, zero_division=0)), 6),
        "f1": round(float(f1_score(y_validation, validation_predictions, zero_division=0)), 6),
    }

    coefficients = pipeline.named_steps["classifier"].coef_[0]
    coefficient_map = {
        feature: round(float(value), 6)
        for feature, value in sorted(zip(FEATURE_NAMES, coefficients), key=lambda item: abs(item[1]), reverse=True)
    }

    with MODEL_PATH.open("wb") as file_handle:
        pickle.dump({"pipeline": pipeline, "feature_names": FEATURE_NAMES, "binary_threshold": binary_threshold}, file_handle)

    metadata = {
        "modelo_class": "DemoTabularLogisticBaseline",
        "dataset": "data/ml/demo_scoring/dataset_demo_backend_features_train.csv",
        "validation_dataset": "data/ml/demo_scoring/dataset_demo_backend_features_validation.csv",
        "target_column": TARGET_COLUMN,
        "feature_names": FEATURE_NAMES,
        "thresholds": {
            "binary": binary_threshold,
            "review": 0.33,
            "fraud": 0.66,
        },
        "sample_output_contract": {
            "score": "0-100",
            "riskClass": [classify_risk(0.1), classify_risk(0.4), classify_risk(0.8)],
            "topFactors": "lista de factores influyentes",
        },
        "metadata": {
            **metrics,
            "version": "demo-tabular-baseline-v1",
            "descripcion": "Baseline tabular demo entrenado solo con dataset sintetico preparado y alineado al payload del backend.",
            "coefficients": coefficient_map,
        },
        "limitations": [
            "Dataset demo con solo 3 positivos reales.",
            "Las metricas de precision, recall y F1 no son suficientes para inferencias productivas.",
            "El modelo se usa para demo end-to-end y facilidad de integracion, no para decision automatica real.",
        ],
    }
    MODEL_INFO_PATH.write_text(json.dumps(metadata, indent=2, ensure_ascii=True), encoding="utf-8")

    print("Modelo baseline demo tabular entrenado.")
    print(f"Modelo: {MODEL_PATH}")
    print(f"Metadata: {MODEL_INFO_PATH}")
    print(json.dumps(metrics, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
