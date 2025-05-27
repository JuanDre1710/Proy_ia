# === entrenar_modelo_river.py ===
# Entrena un modelo inicial con RIVER desde Excel

import pandas as pd
import os
import json
from river import ensemble, metrics, tree

# 1. Cargar dataset Excel
excel_path = r"C:\Users\Jdre\source\Proy_ia\ia_fraude\modelos\entrenar_reentrenar\Worksheet in Case Study question 2.xlsx"
df = pd.read_excel(excel_path)

# 2. Preprocesamiento
if 'incident_date' in df.columns:
    df['incident_date'] = pd.to_datetime(df['incident_date'], errors='coerce')
    df['anio'] = df['incident_date'].dt.year
    df['mes'] = df['incident_date'].dt.month
    df['dia'] = df['incident_date'].dt.day
    df['dia_semana'] = df['incident_date'].dt.weekday
    df.drop(columns=['incident_date'], inplace=True)

# Convertir a binario
df = df[df['fraud_reported'].isin(['Y', 'N'])]
df['fraud_reported'] = df['fraud_reported'].map({'Y': 1, 'N': 0})
df.drop(columns=['policy_number'], errors='ignore', inplace=True)

# Detectar columnas numéricas vs categóricas
X = df.drop(columns=['fraud_reported'])
y = df['fraud_reported']

numeric_cols = X.select_dtypes(include=['number']).columns.tolist()
categorical_cols = X.select_dtypes(exclude=['number']).columns.tolist()

X[numeric_cols] = X[numeric_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
X[categorical_cols] = X[categorical_cols].fillna("Desconocido").astype(str)

# 3. Inicializar modelo incremental
modelo = ensemble.BaggingClassifier(model=tree.HoeffdingTreeClassifier(), n_models=10, seed=42)
metric = metrics.Accuracy()

# 4. Entrenamiento
for xi, yi in zip(X.to_dict(orient='records'), y):
    pred = modelo.predict_one(xi)
    if pred is not None:
        metric.update(yi, pred)
    modelo.learn_one(xi, yi)

print(f"\n✅ Entrenamiento completo. Accuracy: {metric.get():.4f}")

# 5. Guardar modelo
output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../modelo"))
os.makedirs(output_path, exist_ok=True)

# Guardar el nombre del modelo y la clase para trazabilidad
modelo_dict = {
    "modelo_class": modelo.__class__.__name__,
    "params": {},
    "metadata": {
        "accuracy": metric.get(),
        "n_models": len(modelo.models),
        "descripcion": "Modelo River Bagging + HoeffdingTree"
    }
}

with open(os.path.join(output_path, "modelo_fraude_river.json"), "w") as f:
    json.dump(modelo_dict, f, indent=2)

print("📦 Modelo guardado en /modelo/modelo_fraude_river.json")
