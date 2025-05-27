from river import ensemble, tree
import os
import json

# Variable global del modelo
modelo = ensemble.BaggingClassifier(model=tree.HoeffdingTreeClassifier(), n_models=10, seed=42)

# Ruta al archivo JSON del modelo
ruta_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude_river.json"))

def cargar_modelo_json():
    global modelo

    if not os.path.exists(ruta_json):
        print("⚠️ No se encontró el modelo. Usando instancia nueva.")
        return

    try:
        with open(ruta_json, "r") as f:
            modelo_data = json.load(f)

        # Crear un nuevo modelo vacío con misma configuración
        n_models = modelo_data["metadata"].get("n_models", 10)
        modelo = ensemble.BaggingClassifier(
            model=tree.HoeffdingTreeClassifier(),
            n_models=n_models,
            seed=42
        )

        print("✅ Modelo cargado correctamente desde modelo_fraude_river.json")

    except Exception as e:
        print(f"❌ Error al cargar el modelo: {e}")
