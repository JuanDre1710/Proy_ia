import joblib
import numpy as np
import pandas as pd

# Cargar modelo y encoders
modelo = joblib.load("modelo_fraude.pkl")
encoders = joblib.load("label_encoders.pkl")

# Umbrales de clasificación
def clasificar_fraude(prob):
    if prob < 0.33:
        return "Normal"
    elif prob < 0.66:
        return "Requiere revisión"
    else:
        return "Sospechoso de fraude"

# Función principal de predicción
def evaluar_caso(input_dict):
    df = pd.DataFrame([input_dict])

    # Aplicar los mismos encoders que en el entrenamiento
    for col, encoder in encoders.items():
        if col in df.columns:
            df[col] = df[col].fillna("Desconocido").astype(str)
            df[col] = encoder.transform(df[col])

    # Predecir
    prob_fraude = modelo.predict_proba(df)[0][1]
    score = int(prob_fraude * 100)
    clasificacion = clasificar_fraude(prob_fraude)

    # Importancia de variables
    importancias = modelo.feature_importances_
    top_vars = sorted(zip(df.columns, importancias), key=lambda x: x[1], reverse=True)[:3]
    explicacion = [{"variable": v, "impacto": round(i, 3)} for v, i in top_vars]

    return {
        "score": score,
        "clasificacion": clasificacion,
        "explicacion": explicacion
    }
