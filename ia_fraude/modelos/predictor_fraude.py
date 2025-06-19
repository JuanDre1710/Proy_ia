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

# Calcular impacto
def calcular_impacto(variable, valor):
    try:
        for learner in modelo.learners:
            stats = learner._root.stats
            if variable in stats and hasattr(stats[variable], 'mean'):
                media = stats[variable].mean.get()
                varianza = stats[variable].var.get()
                if varianza > 0:
                    distancia = abs(valor - media)
                    if distancia > 2 * (varianza ** 0.5):
                        return "Valor inusual"
        return "Normal"
    except:
        return "N/A"

def predecir_caso(input_dict):
    # Convertir columnas booleanas de string a bool
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

    # Explicación con impacto heurístico
    explicacion = []
    for variable, valor in input_dict.items():
        impacto = calcular_impacto(variable, valor)
        explicacion.append({"variable": variable, "impacto": impacto})

    explicacion_filtrada = [e for e in explicacion if e["impacto"] != "N/A"][:3]
    if not explicacion_filtrada:
        explicacion_filtrada = explicacion[:3]

    return {
        "score": score,
        "clasificacion": clasificacion,
        "explicacion": explicacion_filtrada
    }