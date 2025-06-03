# === modelos/entrenador_fraude.py ===

from modelos.modelo_memoria import modelo
import os
import json

# Ruta del archivo JSON donde se guarda el modelo
ruta_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude_river.json"))

def entrenar_caso(input_dict):
    # Sacar la etiqueta de la entrada
    y = input_dict.pop("fraude_confirmado", None)
    if y is None:
        y = input_dict.pop("es_fraude", 0)  

    # Aprender con el caso nuevo
    modelo.learn_one(input_dict, y)

    # Guardar el modelo actualizado
    modelo_dict = {
        "modelo_class": modelo.__class__.__name__,
        "metadata": {
            "descripcion": "Modelo actualizado en /reentrenar"
        }
    }

    with open(ruta_json, "w") as f:
        json.dump(modelo_dict, f, indent=2)

    return {"mensaje": "✅ Modelo actualizado con el nuevo caso"}
