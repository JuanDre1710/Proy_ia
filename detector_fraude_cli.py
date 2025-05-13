# detector_fraude.py

from llamadas_api.SQL_cli import Cliente, Prueba
from llamadas_api.Llamada_API_renaper import Procesar_cliente
from fraudes.modelo_fraude import es_fraude
from fraudes.fraude_identidad import evaluar_identidad
import logging
import time

def main():
# Configuración de logging
    logging.basicConfig(filename='evaluaciones_fraude.log', level=logging.INFO, format='%(asctime)s - %(message)s')

    # Medir tiempo de procesamiento
    inicio = time.time()

    # Paso 1: Ingreso de datos e intento de verificar en base
    cliente, conn = Prueba()

    # Paso 2: Consultar RENAPER si no tiene datos completos
    print("🔎 Consultando RENAPER con DNI...")
    datos_renaper = Procesar_cliente(cliente.dni)

    if not datos_renaper:
        print("❌ No se pudo obtener información de RENAPER.")
        return

    # Paso 3: Evaluar riesgo de identidad
    evaluacion = evaluar_identidad(datos_renaper)

    print(f"\n📋 Resultado de evaluación de identidad:")
    print(f"🧮 Score: {evaluacion['score']}")
    print(f"📊 Clasificación: {evaluacion['clasificacion']}")
    print("📌 Motivos:")
    for motivo in evaluacion["motivos"]:
        print(f"  - {motivo}")

    # Paso 4: Guardar resultado en la base de datos
    try:
        cliente.nombre = datos_renaper.get("nombre")
        cliente.apellido = datos_renaper.get("apellido")
        cliente.nacionalidad = datos_renaper.get("nacionalidad")
        cliente.insertar_nuevo_cliente(conn)  # Asegura que esté en la tabla Clientes

        cliente.guardar_resultado_fraude(
            conn,
            resultado=evaluacion["clasificacion"],
            probabilidad=evaluacion["score"]
        )
    except Exception as e:
        print("⚠️ Error al guardar los resultados:", e)

    # Log para auditoría
    logging.info(f"DNI {cliente.dni} evaluado como {evaluacion['clasificacion']} con score {evaluacion['score']}. Motivos: {evaluacion['motivos']}")

    # Final
    fin = time.time()
    print(f"\n⏱ Tiempo total de evaluación: {fin - inicio:.2f} segundos.")
    conn.close()

if __name__ == "__main__":
    main()

