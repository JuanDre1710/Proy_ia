from fastapi import FastAPI, Request
from modelos.predictor_fraude import evaluar_caso
from modelos.modelo_watcher import iniciar_watcher
import uvicorn

app = FastAPI(title="ERS - Motor IA Antifraude")

@app.post("/evaluar")
async def evaluar(request: Request):
    input_data = await request.json()
    resultado = evaluar_caso(input_data)
    return resultado

if __name__ == "__main__":
    observer = iniciar_watcher()
    try:
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
    except KeyboardInterrupt:
        observer.stop()
        observer.join()
