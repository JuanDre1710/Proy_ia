import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# === 1. Cargar dataset ===
excel_path = r".\ia_fraudes\modelos\entrenar_reentrenar\Worksheet in Case Study question 2.xlsx"

df = pd.read_excel(excel_path)
print(f"Dataset cargado: {df.shape[0]} filas, {df.shape[1]} columnas")

# === 2. Preprocesamiento ===

# Eliminar columnas irrelevantes
cols_to_drop = ['policy_number']
df.drop(columns=[c for c in cols_to_drop if c in df.columns], inplace=True)

# Convertir fechas
if 'incident_date' in df.columns:
    df['fecha'] = pd.to_datetime(df['incident_date'], errors='coerce')
    df['anio'] = df['fecha'].dt.year
    df['mes'] = df['fecha'].dt.month
    df['dia'] = df['fecha'].dt.day
    df['dia_semana'] = df['fecha'].dt.weekday
    df.drop(columns=['incident_date', 'fecha'], inplace=True)

# Codificación de variables categóricas
label_encoders = {}
for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].fillna("Desconocido").astype(str)
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

# Rellenar nulos en columnas numéricas (sin inplace)
for col in df.select_dtypes(include=np.number).columns:
    df[col] = df[col].fillna(df[col].median())

# Asegurar que no haya columnas datetime restantes
df = df.drop(columns=df.select_dtypes(include=["datetime64[ns]"]).columns)

# Procesar la variable objetivo
if 'fraud_reported' in df.columns:
    print("\nValores únicos en 'fraud_reported':")
    print(df['fraud_reported'].unique())

    # Validar que sean solo 0 y 1
    df = df[df['fraud_reported'].isin([0, 1])]

    y = df['fraud_reported']
    X = df.drop(columns=['fraud_reported'])
else:
    raise ValueError("No se encontró la columna 'fraud_reported' en el dataset.")

# === 3. Entrenamiento ===

try:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    modelo = RandomForestClassifier(n_estimators=100, random_state=42)
    modelo.fit(X_train, y_train)

    # === 4. Evaluación ===
    y_pred = modelo.predict(X_test)
    print("\n--- Reporte de clasificación ---")
    print(classification_report(y_test, y_pred))

    # === 5. Guardado ===
    os.makedirs("modelo", exist_ok=True)
    joblib.dump(modelo, "modelo/modelo_fraude.pkl")
    joblib.dump(label_encoders, "modelo/label_encoders.pkl")
    print("\n✅ Modelo y encoders guardados en carpeta 'modelo/'")

except Exception as e:
    print(f"❌ Error durante el entrenamiento: {e}")

