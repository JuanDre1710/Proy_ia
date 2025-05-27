import os
import joblib

# Ruta al archivo del modelo
ruta_modelo = os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude.pkl")

# Cargar el modelo entrenado
modelo = joblib.load(ruta_modelo)

# Verificar si el modelo tiene atributo 'feature_names_in_'
if hasattr(modelo, "feature_names_in_"):
    columnas = modelo.feature_names_in_
    print("\n🧠 El modelo espera las siguientes columnas de entrada:\n")
    for col in columnas:
        print(f"- {col}")
    print(f"\n🔢 Total: {len(columnas)} columnas.")
else:
    print("⚠️ Este modelo no contiene información de las columnas originales ('feature_names_in_').")
    print("Es posible que haya sido entrenado con una versión de scikit-learn < 1.0")
