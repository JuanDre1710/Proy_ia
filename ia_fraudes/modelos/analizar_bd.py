import pandas as pd
import numpy as np
import joblib
import pyodbc
import os
from predictor_fraude import clasificar_fraude

# === 1. Configuración ===

DB_CONFIG = {
    'server': 'vm2016macrodi',
    'database': 'iSol_Macro_NET_DES',
    'username': 'innovacion',
    'password': 'innovacion'
}

QUERY = """
select  top 10 * from EXT_CLIENTES CLI

inner join POLIZAS PZA ON PZA.CLI_IDTITULAR = CLI.CLI_ID 

LEFT join	 PZA_VEHICULOS PVH ON PVH.PZA_NROSOL = PZA.PZA_NROSOL

LEFT join	 PZA_UBIC_RIESGO PUR ON PUR.PZA_NROSOL = PZA.PZA_NROSOL


LEFT join	 PZA_BENEFICIARIOS PZB ON PUR.PZA_NROSOL = PZA.PZA_NROSOL

LEFT join	 PZA_ASEGURADOS PAS ON PAS.PZA_NROSOL = PZA.PZA_NROSOL

INNER join	 POLIZAS_SINIESTROS PIN ON PIN.PZA_NROSOL = PZA.PZA_NROSOL
INNER JOIN SINIESTROS PSI ON PIN.PSI_ID = PSI.PSI_ID
"""

MODELO_PATH = "modelo/modelo_fraude.pkl"
ENCODERS_PATH = "modelo/label_encoders.pkl"

# === 2. Cargar modelo y encoders ===

modelo = joblib.load(MODELO_PATH)
encoders = joblib.load(ENCODERS_PATH)

# === 3. Conexión y extracción de datos ===

conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={DB_CONFIG['server']};"
    f"DATABASE={DB_CONFIG['database']};"
    f"UID={DB_CONFIG['username']};"
    f"PWD={DB_CONFIG['password']}"
)

conn = pyodbc.connect(conn_str)
df = pd.read_sql(QUERY, conn)
conn.close()

print(f"📥 Registros extraídos: {df.shape[0]}")

ids_originales = df['id'] if 'id' in df.columns else df.index

# === 4. Preprocesamiento ===

# Fechas → componentes
for col in df.columns:
    if df[col].dtype == 'datetime64[ns]':
        df[f"{col}_anio"] = df[col].dt.year
        df[f"{col}_mes"] = df[col].dt.month
        df[f"{col}_dia"] = df[col].dt.day
        df.drop(columns=[col], inplace=True)

# Codificación categóricas
for col, encoder in encoders.items():
    if col in df.columns:
        df[col] = df[col].fillna("Desconocido").astype(str)
        df[col] = df[col].map(lambda x: x if x in encoder.classes_ else "Desconocido")
        df[col] = encoder.transform(df[col])

# Rellenar numéricas
for col in df.select_dtypes(include=np.number).columns:
    df[col].fillna(df[col].median(), inplace=True)

# === 5. Evaluación con el modelo ===

probs = modelo.predict_proba(df)[:, 1]
scores = (probs * 100).astype(int)
clases = [clasificar_fraude(p) for p in probs]

# Explicación por importancia
importancias = modelo.feature_importances_
top_vars = sorted(zip(df.columns, importancias), key=lambda x: x[1], reverse=True)[:3]
principales_vars = [v[0] for v in top_vars]

# Guardar resultados
df_resultado = pd.DataFrame({
    "id_caso": ids_originales,
    "score_fraude": scores,
    "clasificacion": clases,
    "explicacion_1": df[principales_vars[0]],
    "explicacion_2": df[principales_vars[1]],
    "explicacion_3": df[principales_vars[2]],
})

salida_csv = "resultado_fraude_2016.csv"
df_resultado.to_csv(salida_csv, index=False)

print(f"\n✅ Evaluación completada. Resultados guardados en: {salida_csv}")
