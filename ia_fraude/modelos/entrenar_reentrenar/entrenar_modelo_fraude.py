# === entrenar_modelo_fraude.py ===
import pandas as pd
import os
import json
from river import ensemble, metrics, tree

# 1. Cargar dataset
excel_path = r"C:\Users\Jdre\source\Proy_ia\ia_fraude\modelos\entrenar_reentrenar\dataset_entrenamiento_corregido.xlsx"
df = pd.read_excel(excel_path)

# 2. Convertir columnas booleanas "True"/"False" en string a booleanos reales
bool_cols = [
    "es_madrugada_finde", "es_siniestro_total", "zona_de_riesgo", "evento_climatico_registrado",
    "ubicacion_inconsistente_con_destino", "peritaje_realizado", "peritaje_congruente",
    "presencia_acelerantes", "imagenes_adjuntas", "imagenes_sospechosas", "gps_desactivado",
    "denuncia_policial", "hay_testigos", "certificado_medico", "factura_valida",
    "proveedor_repetido", "numero_factura_correlativa", "direccion_repetida_con_otro_cliente",
    "telefono_repetido_con_otro_cliente", "testigo_repetido", "perito_repetido",
    "historial_fraude_confirmado", "ocupacion_riesgo_alto", "actividad_comercial_declarante",
    "equipaje_reportado_perdido", "coincide_con_checkin"
]

for col in bool_cols:
    df[col] = df[col].map({"True": True, "False": False})

# 3. Convertir columnas a enteros
int_cols = [
    "cliente_id", "dias_entre_siniestro_y_denuncia", "dias_desde_inicio_poliza",
    "dias_hasta_fin_poliza", "monto_reclamado", "monto_pagado", "valor_asegurado",
    "valor_comercial", "valor_factura", "tipo_bien", "estado_bien", "uso_bien",
    "antiguedad_bien_en_anios", "tipo_siniestro", "estado_siniestro", "provincia_id",
    "cantidad_siniestros_previos", "cantidad_siniestros_mismo_tipo",
    "dias_desde_ultimo_siniestro", "cantidad_cambios_aseguradora",
    "tipo_cliente", "antiguedad_como_cliente_meses"
]

for col in int_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

# 4. Separar variables independientes (X) y dependiente (y)
y = df["es_fraude"]
X = df.drop(columns=["es_fraude"])

# 5. Inicializar modelo incremental
modelo = ensemble.BaggingClassifier(model=tree.HoeffdingTreeClassifier(), n_models=10, seed=42)
metric = metrics.Accuracy()

# 6. Entrenamiento incremental
for xi, yi in zip(X.to_dict(orient="records"), y):
    pred = modelo.predict_one(xi)
    if pred is not None:
        metric.update(yi, pred)
    modelo.learn_one(xi, yi)

print(f"\n✅ Entrenamiento completo. Accuracy: {metric.get():.4f}")

# 7. Guardar modelo (solo metadatos y configuración)
output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../modelo"))
os.makedirs(output_path, exist_ok=True)

modelo_dict = {
    "modelo_class": modelo.__class__.__name__,
    "metadata": {
        "accuracy": metric.get(),
        "n_models": len(modelo.models),
        "descripcion": "Modelo entrenado con dataset de 1000 filas (columnas convertidas)"
    }
}

with open(os.path.join(output_path, "modelo_fraude_river.json"), "w") as f:
    json.dump(modelo_dict, f, indent=2)

print("📦 Modelo guardado en /modelo/modelo_fraude_river.json")
