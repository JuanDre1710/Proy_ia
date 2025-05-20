import os
import joblib
import pandas as pd
import numpy as np

# Rutas relativas al modelo y encoders
ruta_modelo = os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude.pkl")
ruta_encoders = os.path.join(os.path.dirname(__file__), "../../modelo/label_encoders.pkl")

modelo = joblib.load(ruta_modelo)
encoders = joblib.load(ruta_encoders)

# Función auxiliar para extender LabelEncoder de forma segura
def agregar_clase_faltante(encoder, clase):
    """Agrega una clase al encoder si no existe"""
    if clase not in encoder.classes_:
        nuevas_clases = np.append(encoder.classes_, clase)
        encoder.classes_ = np.sort(nuevas_clases)

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

    # Asegurar que estén todas las columnas esperadas por el modelo
    columnas_esperadas = modelo.feature_names_in_
    for col in columnas_esperadas:
        if col not in df.columns:
            df[col] = "Desconocido"  # para categóricas, también se maneja con encoders

    # Eliminar columnas inesperadas (para evitar error de scikit-learn)
    df = df[columnas_esperadas]

    # Aplicar encoders categóricos
    for col, encoder in encoders.items():
        if col in df.columns:
            df[col] = df[col].fillna("Desconocido").astype(str)

            # Agregar clase faltante si es necesario
            if "Desconocido" not in encoder.classes_:
                encoder.classes_ = np.sort(np.append(encoder.classes_, "Desconocido"))

            df[col] = df[col].apply(lambda val: val if val in encoder.classes_ else "Desconocido")
            df[col] = encoder.transform(df[col])

    # Rellenar columnas numéricas restantes con 0 (neutro) si quedaron vacías
    for col in df.columns:
        if col not in encoders:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

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
