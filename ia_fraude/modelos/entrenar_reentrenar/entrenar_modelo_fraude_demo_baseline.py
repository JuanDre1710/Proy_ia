from __future__ import annotations

import json
import pickle
from pathlib import Path

import pandas as pd
from river import ensemble, metrics, tree


REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / "data" / "ml" / "demo_scoring"
MODEL_DIR = REPO_ROOT / "modelo"

TRAIN_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_train_balanced.csv"
VALIDATION_DATASET_PATH = DATA_DIR / "dataset_demo_fraude_validation.csv"
MODEL_PATH = MODEL_DIR / "modelo_fraude_demo_baseline_river.pkl"
MODEL_INFO_PATH = MODEL_DIR / "modelo_fraude_demo_baseline_river.json"

TARGET_COLUMN = "fraude"
DROP_COLUMNS = {"case_id", "dni", "requiere_revision", "nivel_riesgo", "split"}


def _load_split(path: Path) -> tuple[list[dict[str, object]], list[int]]:
    df = pd.read_csv(path)
    features = df.drop(columns=[column for column in DROP_COLUMNS if column in df.columns] + [TARGET_COLUMN])
    labels = df[TARGET_COLUMN].astype(int).tolist()
    return features.to_dict(orient="records"), labels


def main() -> None:
    train_x, train_y = _load_split(TRAIN_DATASET_PATH)
    validation_x, validation_y = _load_split(VALIDATION_DATASET_PATH)

    model = ensemble.BaggingClassifier(model=tree.HoeffdingTreeClassifier(), n_models=10, seed=42)
    for row, label in zip(train_x, train_y):
        model.learn_one(row, label)

    accuracy = metrics.Accuracy()
    precision = metrics.Precision()
    recall = metrics.Recall()
    f1 = metrics.F1()

    for row, label in zip(validation_x, validation_y):
        prediction = model.predict_one(row)
        if prediction is None:
            prediction = 0
        accuracy.update(label, prediction)
        precision.update(label, prediction)
        recall.update(label, prediction)
        f1.update(label, prediction)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as file_handle:
        pickle.dump(model, file_handle)

    metadata = {
        "modelo_class": model.__class__.__name__,
        "dataset": str(TRAIN_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "validation_dataset": str(VALIDATION_DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "metadata": {
            "accuracy": round(float(accuracy.get()), 6),
            "precision": round(float(precision.get()), 6),
            "recall": round(float(recall.get()), 6),
            "f1": round(float(f1.get()), 6),
            "n_models": len(model.models),
            "descripcion": "Baseline demo entrenado sobre dataset sintetico preparado para scoring binario de fraude.",
        },
    }
    MODEL_INFO_PATH.write_text(json.dumps(metadata, indent=2, ensure_ascii=True), encoding="utf-8")

    print("Entrenamiento baseline demo completado.")
    print(f"Modelo: {MODEL_PATH}")
    print(f"Metadata: {MODEL_INFO_PATH}")
    print(json.dumps(metadata["metadata"], indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
