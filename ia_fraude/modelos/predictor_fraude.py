import os
import pickle

# Cargar el modelo real
ruta_modelo = os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude_river.pkl")
with open(ruta_modelo, "rb") as f:
    modelo = pickle.load(f)

# Umbrales de clasificación
def clasificar_fraude(prob):
    if prob < 0.33:
        return "Normal"
    elif prob < 0.66:
        return "Requiere revisión"
    else:
        return "Sospechoso de fraude"

# Función principal de predicción
def predecir_caso(input_dict):
    # Convertir columnas booleanas de "True"/"False" a bool reales
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
        if col in input_dict:
            input_dict[col] = True if input_dict[col] == "True" else False

    # Predicción
    prob_fraude = modelo.predict_proba_one(input_dict).get(1, 0)
    score = int(prob_fraude * 100)
    clasificacion = clasificar_fraude(prob_fraude)

    # Explicación simple (River no tiene feature_importances_)
    top_vars = list(input_dict.keys())[:3]
    explicacion = [{"variable": v, "impacto": "N/A"} for v in top_vars]

    return {
        "score": score,
        "clasificacion": clasificacion,
        "explicacion": explicacion
    }
