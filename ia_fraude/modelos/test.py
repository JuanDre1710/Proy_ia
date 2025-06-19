from predictor_fraude import predecir_caso

# Diccionario con todas las columnas requeridas por el modelo
input_data = {
    "cliente_id": 200099, "tipo_siniestro": 0, "monto_reclamado": 9400000, "cantidad_siniestros_previos": 5,
    "dias_desde_ultimo_siniestro": 4, "dias_entre_siniestro_y_denuncia": 12, "dias_hasta_fin_poliza": 5, "estado_bien": 2,
    "imagenes_adjuntas": 0, "imagenes_sospechosas": 1, "denuncia_policial": 0,
    "presencia_acelerantes": 1, "ubicacion_inconsistente_con_destino": 1,
    "evento_climatico_registrado": 0, "hay_testigo": 0, "zona_de_riesgo": 0,
    "peritaje_realizado": 0, "peritaje_congruente": 0,
    "proveedor_repetido": 1, "perito_repetido": 0, "testigo_repetido": 1,
    "direccion_repetida_con_otro_cliente": 1, "telefono_repetido_con_otro_cliente": 1,
    "historial_fraude_confirmado": 0
  }

# Ejecutar evaluación
resultado = predecir_caso(input_data)

# Mostrar resultado
print("\n🧠 Resultado de la IA:")
print(f"Score: {resultado['score']}")
print(f"Clasificación: {resultado['clasificacion']}")
print("Explicación:")
for item in resultado["explicacion"]:
    print(f" - {item['variable']} → impacto: {item['impacto']}")
