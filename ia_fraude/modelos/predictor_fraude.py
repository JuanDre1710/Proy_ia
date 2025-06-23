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
    reglas_alerta = {
        "zona_de_riesgo": lambda v: "Alerta de riesgo" if v is True else None,
        "gps_desactivado": lambda v: "Alerta de riesgo" if v is True else None,
        "imagenes_sospechosas": lambda v: "Alerta de riesgo" if v is True else None,
        "presencia_acelerantes": lambda v: "Alerta de riesgo" if v is True else None,
        "antiguedad_como_cliente_meses": lambda v: "Muy reciente" if isinstance(v, int) and v < 3 else None,
        "antiguedad_bien_en_anios": lambda v: "Bien nuevo" if isinstance(v, int) and v < 1 else None,
        "monto_reclamado": lambda v: "Monto elevado" if isinstance(v, (int, float)) and v > 100000 else None,
        "cantidad_siniestros_previos": lambda v: "Reincidencia" if isinstance(v, int) and v > 3 else None,
    }

    regla = reglas_alerta.get(variable)
    if regla:
        resultado = regla(valor)
        if resultado:
            return resultado

    return "Normal"


def predecir_caso(input_dict):

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
    for variable, valor in sorted(input_dict.items()):
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