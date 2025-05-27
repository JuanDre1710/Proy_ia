# === modelo_memoria.py ===
# Carga y mantiene el modelo River en memoria, permite recarga desde JSON

from river import ensemble, utils
import os
import json

modelo = ensemble.AdaptiveRandomForestClassifier(seed=42)

# Ruta del modelo guardado
ruta_modelo_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude_river.json"))

def cargar_modelo_json():
    global modelo
    if os.path.exists(ruta_modelo_json):
        with open(ruta_modelo_json, "r") as f:
            modelo_dict = json.load(f)
            modelo = utils.dict_to_model(modelo_dict)
            print("✅ Modelo River cargado desde JSON")
    else:
        print("⚠️ No se encontró modelo_fraude_river.json. Usando modelo vacío por defecto.")

# Cargar modelo automáticamente al iniciar
cargar_modelo_json()
