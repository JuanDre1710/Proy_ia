import requests
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime

# ------------------------------
# 1. ENTRENAMIENTO SIMULADO DEL MODELO (solo para este ejemplo)
# ------------------------------

def entrenar_modelo_ejemplo():
    # Dataset simulado
    data = pd.DataFrame({
        "edad": [25, 60, 35, 45],
        "genero_M": [1, 1, 0, 0],
        "genero_F": [0, 0, 1, 1],
        "riesgo": [0, 1, 0, 1]  # 0 = normal, 1 = fraude
    })

    X = data[["edad", "genero_M", "genero_F"]]
    y = data["riesgo"]

    modelo = RandomForestClassifier()
    modelo.fit(X, y)

    joblib.dump(modelo, "modelo.pkl")

# Ejecutar solo una vez (podés comentar luego)
entrenar_modelo_ejemplo()

# ------------------------------
# 2. CARGAR EL MODELO ENTRENADO
# ------------------------------

modelo = joblib.load("modelo.pkl")

# ------------------------------
# 3. OBTENER DATOS DESDE LA API
# ------------------------------

def obtener_datos_desde_api():
    # Simulación de respuesta JSON desde una API
    response_json = {
        "status": True,
        "message": "Operación exitosa",
        "code": 901,
        "code_description": "NEW_OPERATION_OK",
        "response": {
            "operation_id": 12345,
            "number": 12392994,
            "gender": "M",
            "document_data": {
                "first_name": "Juan",
                "last_name": "Pérez",
                "birth_date": "1990-01-01",
                "address": "Calle Ficticia 123",
                "document_type": "DNI"
            }
        }
    }
    return response_json

# ------------------------------
# 4. PROCESAR LOS DATOS PARA EL MODELO
# ------------------------------

def procesar_datos_para_modelo(data_json):
    birth_date = data_json["response"]["document_data"]["birth_date"]
    gender = data_json["response"]["gender"]

    # Calcular edad
    birth_year = int(birth_date.split("-")[0])
    current_year = datetime.now().year
    edad = current_year - birth_year

    # Codificación de género
    genero_M = 1 if gender == "M" else 0
    genero_F = 1 if gender == "F" else 0

    # Crear DataFrame de entrada
    df = pd.DataFrame([{
        "edad": edad,
        "genero_M": genero_M,
        "genero_F": genero_F
    }])

    return df

# ------------------------------
# 5. FLUJO PRINCIPAL
# ------------------------------

def analizar_operacion():
    api_data = obtener_datos_desde_api()
    df_modelo = procesar_datos_para_modelo(api_data)

    prediccion = modelo.predict(df_modelo)[0]
    resultado = "⚠️ Fraude detectado" if prediccion == 1 else "✅ Operación normal"

    print("\n--- Resultado ---")
    print(f"Predicción del modelo: {resultado}")
    print("Datos analizados:", df_modelo.to_dict(orient="records")[0])

# Ejecutar análisis
if __name__ == "__main__":
    analizar_operacion()
