from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / "data" / "ml" / "demo_scoring"
RAW_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_1000_raw.csv"
PREPARED_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_preparado.csv"
TRAIN_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_train.csv"
TRAIN_BALANCED_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_train_balanced.csv"
VALIDATION_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_validation.csv"
MANIFEST_PATH = DATA_DIR / "dataset_demo_fraude_manifest.json"

TARGET_COLUMN = "fraude"
TRACEABILITY_COLUMNS = ["case_id", "dni"]
AUXILIARY_COLUMNS = ["requiere_revision", "nivel_riesgo"]
EXCLUDED_COLUMNS = {
    "case_id": "Identificador unico del caso; solo sirve para trazabilidad.",
    "dni": "Identificador sensible del titular; no aporta generalizacion.",
    "fecha_siniestro": "Se reemplaza por variables temporales derivadas para evitar dependencia de formato.",
    "requiere_revision": "Variable operativa derivada del workflow demo; no debe entrenar el target principal.",
    "nivel_riesgo": "Etiqueta agregada derivada del target y del estado de revision; fuga de informacion directa.",
    "cluster_fraude": "Flag sintetico interno del generador demo; no esta disponible en inferencia realista.",
}

FEATURE_COLUMNS = [
    "edad",
    "provincia",
    "antiguedad_domicilio_meses",
    "situacion_laboral",
    "antiguedad_laboral_meses",
    "ingresos_mensuales",
    "score_crediticio",
    "deuda_total",
    "cantidad_deudas",
    "cheques_rechazados",
    "tipo_siniestro",
    "frecuencia_siniestros_ultimo_anio",
    "monto_reclamado",
    "repite_domicilio",
    "repite_telefono",
    "cambio_aseguradora_frecuente",
    "denuncia_tardia",
    "siniestro_cerca_vencimiento",
    "testigo_repetido",
    "inconsistencia_ingresos_vs_deuda",
    "inconsistencia_laboral",
    "datos_incompletos",
    "mes_siniestro",
    "trimestre_siniestro",
    "dia_semana_siniestro",
    "fin_de_semana_siniestro",
]

RAW_NUMERIC_COLUMNS = [
    "edad",
    "antiguedad_domicilio_meses",
    "antiguedad_laboral_meses",
    "ingresos_mensuales",
    "score_crediticio",
    "deuda_total",
    "cantidad_deudas",
    "cheques_rechazados",
    "frecuencia_siniestros_ultimo_anio",
    "monto_reclamado",
    "repite_domicilio",
    "repite_telefono",
    "cambio_aseguradora_frecuente",
    "denuncia_tardia",
    "siniestro_cerca_vencimiento",
    "testigo_repetido",
    "inconsistencia_ingresos_vs_deuda",
    "inconsistencia_laboral",
    "datos_incompletos",
    TARGET_COLUMN,
]

DERIVED_NUMERIC_COLUMNS = [
    "mes_siniestro",
    "trimestre_siniestro",
    "dia_semana_siniestro",
    "fin_de_semana_siniestro",
]

CATEGORICAL_COLUMNS = [
    "provincia",
    "situacion_laboral",
    "tipo_siniestro",
    "nivel_riesgo",
]


def _normalize_text(value: object) -> str:
    return str(value).strip().lower()


def _prepare_dataframe(raw_df: pd.DataFrame) -> pd.DataFrame:
    df = raw_df.copy()

    for column in CATEGORICAL_COLUMNS:
        df[column] = df[column].map(_normalize_text)

    for column in RAW_NUMERIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="raise").astype(int)

    parsed_dates = pd.to_datetime(df["fecha_siniestro"], format="%d/%m/%Y", errors="raise")
    df["mes_siniestro"] = parsed_dates.dt.month.astype(int)
    df["trimestre_siniestro"] = parsed_dates.dt.quarter.astype(int)
    df["dia_semana_siniestro"] = parsed_dates.dt.dayofweek.astype(int)
    df["fin_de_semana_siniestro"] = (parsed_dates.dt.dayofweek >= 5).astype(int)

    for column in DERIVED_NUMERIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="raise").astype(int)

    output_columns = TRACEABILITY_COLUMNS + FEATURE_COLUMNS + AUXILIARY_COLUMNS + [TARGET_COLUMN]
    prepared = df.loc[:, output_columns].copy()
    prepared["split"] = "full"
    return prepared


def _stratified_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    positives = df[df[TARGET_COLUMN] == 1].sample(frac=1, random_state=42)
    negatives = df[df[TARGET_COLUMN] == 0].sample(frac=1, random_state=42)

    validation_positive_count = max(1, int(round(len(positives) * 0.2)))
    validation_negative_count = int(round(len(negatives) * 0.2))

    validation = pd.concat(
        [
            positives.iloc[:validation_positive_count],
            negatives.iloc[:validation_negative_count],
        ],
        ignore_index=True,
    ).sample(frac=1, random_state=42)

    train = pd.concat(
        [
            positives.iloc[validation_positive_count:],
            negatives.iloc[validation_negative_count:],
        ],
        ignore_index=True,
    ).sample(frac=1, random_state=42)

    return train, validation


def _oversample_training_data(train_df: pd.DataFrame, min_positive_ratio: float = 0.05) -> pd.DataFrame:
    positives = train_df[train_df[TARGET_COLUMN] == 1]
    negatives = train_df[train_df[TARGET_COLUMN] == 0]

    desired_positive_count = max(
        len(positives),
        int(round((len(negatives) * min_positive_ratio) / (1 - min_positive_ratio))),
    )
    additional_positive_count = max(0, desired_positive_count - len(positives))

    replicated_positives = positives.sample(
        n=additional_positive_count,
        replace=True,
        random_state=42,
    )
    balanced = pd.concat([train_df, replicated_positives], ignore_index=True).sample(frac=1, random_state=42)
    return balanced


def _class_balance(df: pd.DataFrame) -> dict[str, object]:
    counts = df[TARGET_COLUMN].value_counts().sort_index()
    total = int(len(df))
    return {
        "rows": total,
        "positives": int(counts.get(1, 0)),
        "negatives": int(counts.get(0, 0)),
        "positive_ratio": round(float(counts.get(1, 0) / total), 6) if total else 0.0,
    }


def _build_manifest(raw_df: pd.DataFrame, prepared_df: pd.DataFrame, train_df: pd.DataFrame, balanced_train_df: pd.DataFrame, validation_df: pd.DataFrame) -> dict[str, object]:
    return {
        "dataset_name": "dataset_demo_fraude_1000",
        "dataset_role": "demo_baseline_scoring",
        "source_path": str(RAW_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "prepared_path": str(PREPARED_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "train_path": str(TRAIN_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "train_balanced_path": str(TRAIN_BALANCED_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "validation_path": str(VALIDATION_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "target_column": TARGET_COLUMN,
        "feature_columns": FEATURE_COLUMNS,
        "traceability_columns": TRACEABILITY_COLUMNS,
        "auxiliary_columns": AUXILIARY_COLUMNS,
        "excluded_columns": EXCLUDED_COLUMNS,
        "quality": {
            "row_count": int(len(raw_df)),
            "column_count": int(len(raw_df.columns)),
            "missing_values": {column: int(value) for column, value in raw_df.isna().sum().items()},
            "numeric_columns": [column for column in FEATURE_COLUMNS if column not in {"provincia", "situacion_laboral", "tipo_siniestro"}],
            "categorical_columns": ["provincia", "situacion_laboral", "tipo_siniestro"],
            "label_distribution": _class_balance(prepared_df),
            "auxiliary_distribution": {
                "requiere_revision": {str(key): int(value) for key, value in prepared_df["requiere_revision"].value_counts().sort_index().items()},
                "nivel_riesgo": {str(key): int(value) for key, value in prepared_df["nivel_riesgo"].value_counts().items()},
            },
        },
        "splits": {
            "train": _class_balance(train_df),
            "train_balanced": _class_balance(balanced_train_df),
            "validation": _class_balance(validation_df),
        },
        "observations": [
            "El target principal fraude tiene solo 3 positivos sobre 1000 filas; no alcanza para una validacion robusta de produccion.",
            "nivel_riesgo reproduce directamente el target fraude y el estado requiere_revision, por lo que se excluye del entrenamiento.",
            "requiere_revision es util para analisis de pipeline demo, pero no debe ser feature del modelo binario principal.",
            "cluster_fraude es un artefacto del generador sintetico y no representa una variable operativa disponible al inferir.",
            "La version train_balanced usa duplicacion controlada de positivos solo para entrenamiento baseline; validation permanece sin balancear.",
        ],
        "limitations": [
            "Sin integracion con proveedores reales ni evidencia documental externa.",
            "Posibles patrones sinteticos demasiado limpios para representar ruido de negocio real.",
            "La calibracion del score no debe considerarse productiva con este dataset.",
        ],
    }


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    raw_df = pd.read_csv(RAW_DATASET_PATH, sep=";")
    prepared_df = _prepare_dataframe(raw_df)
    train_df, validation_df = _stratified_split(prepared_df)
    balanced_train_df = _oversample_training_data(train_df)

    train_df = train_df.copy()
    validation_df = validation_df.copy()
    balanced_train_df = balanced_train_df.copy()

    train_df["split"] = "train"
    validation_df["split"] = "validation"
    balanced_train_df["split"] = "train_balanced"

    prepared_df.to_csv(PREPARED_DATASET_PATH, index=False)
    train_df.to_csv(TRAIN_DATASET_PATH, index=False)
    balanced_train_df.to_csv(TRAIN_BALANCED_DATASET_PATH, index=False)
    validation_df.to_csv(VALIDATION_DATASET_PATH, index=False)

    manifest = _build_manifest(raw_df, prepared_df, train_df, balanced_train_df, validation_df)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=True), encoding="utf-8")

    print("Dataset demo preparado para baseline.")
    print(f"Prepared: {PREPARED_DATASET_PATH}")
    print(f"Train: {TRAIN_DATASET_PATH}")
    print(f"Train balanced: {TRAIN_BALANCED_DATASET_PATH}")
    print(f"Validation: {VALIDATION_DATASET_PATH}")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
