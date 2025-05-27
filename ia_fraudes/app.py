# === app.py ===
from fastapi import FastAPI, Request
from modelos.predictor_fraude import predecir_caso
from modelos.entrenar_reentrenar.entrenar_modelo_fraude import entrenar_caso
from modelos.modelo_watcher import iniciar_watcher
from utils.validadores import validar_input
import uvicorn

app = FastAPI(title="ERS - IA Microservicio River", version="1.0")

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

if __name__ == "__main__":
    observer = iniciar_watcher()
    try:
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
    except KeyboardInterrupt:
        observer.stop()
        observer.join()

