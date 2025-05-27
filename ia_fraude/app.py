# === app.py ===
from fastapi import FastAPI, Request
from modelos.predictor_fraude import predecir_caso
from modelos.entrenador_fraude import entrenar_caso
from modelos.modelo_watcher import iniciar_watcher
from utils.schema import EvaluacionInput
from utils.validadores import validar_input
import uvicorn

app = FastAPI(title="ERS - IA Microservicio River", version="1.0")

@app.post("/evaluar")
async def evaluar(input_data: EvaluacionInput):
    input_dict = input_data.dict(exclude_none=True)
    return predecir_caso(input_dict)

@app.post("/reentrenar")
async def reentrenar(input_data: EvaluacionInput):
    input_dict = input_data.dict(exclude_none=True)
    return entrenar_caso(input_dict)

if __name__ == "__main__":
    observer = iniciar_watcher()
    try:
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
    except KeyboardInterrupt:
        observer.stop()
        observer.join()

