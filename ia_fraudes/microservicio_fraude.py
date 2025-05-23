# Estructura recomendada para tu microservicio IA (FastAPI + River + modularizado)

# === /PROY_IA/ia_microservicio/
# ├── app.py                    # Punto de entrada de FastAPI
# ├── model_manager/
# │   ├── __init__.py           # Inicializador de paquete
# │   ├── predictor.py           # predicción REST con River
# │   ├── trainer.py             # entrenamiento incremental REST
# │   ├── storage.py             # guardado y carga del modelo
# └── utils/
#     ├── validators.py          # validaciones de datos de entrada
#     └── schemas.py             # Pydantic models para inputs/outputs

# === app.py ===
from fastapi import FastAPI, Request
from modelos.predictor_fraude import predecir_caso
from modelos.trainer import entrenar_caso
from utils.validators import validar_input

app = FastAPI(title="ERS IA Microservicio", version="1.0")

@app.post("/evaluar")
async def evaluar(request: Request):
    input_data = await request.json()
    validar_input(input_data)
    return predecir_caso(input_data)

@app.post("/reentrenar")
async def reentrenar(request: Request):
    input_data = await request.json()
    validar_input(input_data, requiere_label=True)
    return entrenar_caso(input_data)

# === model_manager/predictor.py ===
from .storage import modelo

def predecir_caso(input_dict):
    score = modelo.predict_proba_one(input_dict).get(1, 0)
    clasificacion = (
        "Normal" if score < 0.33 else
        "Requiere revisión" if score < 0.66 else
        "Sospechoso de fraude"
    )
    return {
        "score": int(score * 100),
        "clasificacion": clasificacion,
        "explicacion": list(input_dict.keys())[:3]  # placeholder explicación simple
    }

# === model_manager/trainer.py ===
from .storage import modelo

def entrenar_caso(input_dict):
    y = input_dict.pop("fraude_confirmado")
    modelo.learn_one(input_dict, y)
    return {"mensaje": "Modelo actualizado"}

# === model_manager/storage.py ===
from river import ensemble

# Inicialización en memoria (puede reemplazarse por carga desde disco)
modelo = ensemble.AdaptiveRandomForestClassifier(seed=42)

# === utils/validators.py ===
def validar_input(data, requiere_label=False):
    if not isinstance(data, dict):
        raise ValueError("El input debe ser un JSON objeto.")
    if requiere_label and "fraude_confirmado" not in data:
        raise ValueError("Falta la etiqueta 'fraude_confirmado' para reentrenar.")

# === utils/schemas.py === (opcional si querés usar Pydantic en lugar de validaciones manuales)
from pydantic import BaseModel
from typing import Optional

class EvaluacionInput(BaseModel):
    age: int
    auto_make: str
    auto_model: str
    total_claim_amount: float
    # etc.

class ReentrenamientoInput(EvaluacionInput):
    fraude_confirmado: int
