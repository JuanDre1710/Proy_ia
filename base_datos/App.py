from fastapi import FastAPI
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Crear instancia de la app FastAPI
app = FastAPI(title="ERS API - Backend de Datos", version="1.0")

# Rutas de prueba básicas (las reales se importarán desde módulos luego)

@app.get("/")
def root():
    return {"mensaje": "ERS API funcionando. Conectada a la base de datos."}
    
