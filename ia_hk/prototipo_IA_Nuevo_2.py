import requests
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime

# ------------------------------
# 1. ENTRENAMIENTO SIMULADO DEL MODELO (si ya lo tenés entrenado, podés comentar esto)
# ------------------------------

def entrenar_modelo_ejemplo():
    data = pd.DataFrame({
        "edad": [25, 60, 35, 45],
        "genero_M": [1, 1, 0, 0],
        "genero_F": [0, 0, 1, 1],
        "riesgo": [0, 1, 0, 1]
    })

    X = data[["edad", "genero_M", "genero_F"]]
    y = data["riesgo"]

    modelo = RandomForestClassifier()
    modelo.fit(X, y)

    joblib.dump(modelo, "modelo.pkl")

# Ejecutar solo una vez si no existe el archivo
entrenar_modelo_ejemplo()

# ------------------------------
# 2. CARGAR EL MODELO ENTRENADO
# ------------------------------

modelo = joblib.load("modelo.pkl")

# ------------------------------
# 3. OBTENER DATOS DESDE TU API REAL
# ------------------------------

def obtener_datos_desde_api(identificador):
    url = f"https://github.com/damiansastre/pyrenaper.git"

    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error al consultar la API: {e}")
        return None

# ------------------------------
# 4. PROCESAR LOS DATOS PARA EL MODELO
# ------------------------------

def procesar_datos_para_modelo(data_json):
    try:
        document_data = data_json["response"].get("document_data", {})
        gender = data_json["response"].get("gender", None)
        birth_date = document_data.get("birth_date", None)

        # Calcular edad si se puede
        if birth_date:
            birth_year = int(birth_date.split("-")[0])
            current_year = datetime.now().year
            edad = current_year - birth_year
        else:
            edad = 0  # o np.nan si preferís usar imputación

        # Codificación de género
        genero_M = 1 if gender == "M" else 0
        genero_F = 1 if gender == "F" else 0

        df = pd.DataFrame([{
            "edad": edad,
            "genero_M": genero_M,
            "genero_F": genero_F
        }])

        return df

    except Exception as e:
        print(f"Error al procesar los datos: {e}")
        return None

# ------------------------------
# 5. FLUJO PRINCIPAL
# ------------------------------

def analizar_operacion():
    identificador = input("🔍 Ingresá el identificador a consultar (ej: número de operación o DNI): ")

    api_data = obtener_datos_desde_api(identificador)

    if not api_data or not api_data.get("status"):
        print("❌ No se pudo obtener una respuesta válida de la API.")
        return

    df_modelo = procesar_datos_para_modelo(api_data)

    if df_modelo is None:
        print("❌ No se pudo procesar los datos para el modelo.")
        return

    prediccion = modelo.predict(df_modelo)[0]
    resultado = "⚠️ Fraude detectado" if prediccion == 1 else "✅ Operación normal"

    print("\n--- Resultado ---")
    print(f"Predicción del modelo: {resultado}")
    print("Datos analizados:", df_modelo.to_dict(orient="records")[0])

# Ejecutar análisis
if __name__ == "__main__":
    analizar_operacion()