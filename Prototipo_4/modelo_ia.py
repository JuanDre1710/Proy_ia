def procesar_datos_renaper(data):
    # Simulación del procesamiento con IA
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    edad = data.get("edad", "desconocida")
    
    print(f"Procesando a {nombre} {apellido}, edad: {edad}")
    
    # Aquí podría ir un modelo ML real, por ejemplo una predicción de riesgo
    resultado = {
        "nombre_completo": f"{nombre} {apellido}",
        "clasificacion_ia": "aprobado" if edad != "desconocida" else "pendiente"
    }
    return resultado
