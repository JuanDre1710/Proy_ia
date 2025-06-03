import os
import pickle

# Cargar el modelo real
ruta_modelo = os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude_river.pkl")
with open(ruta_modelo, "rb") as f:
    modelo = pickle.load(f)

def entrenar_caso(input_dict):
    # Convertir columnas booleanas
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

    y = input_dict.pop("fraude_confirmado")
    modelo.learn_one(input_dict, y)

    # Guardar el modelo actualizado
    with open(ruta_modelo, "wb") as f:
        pickle.dump(modelo, f)

    return {"mensaje": "✅ Modelo actualizado con el nuevo caso"}
