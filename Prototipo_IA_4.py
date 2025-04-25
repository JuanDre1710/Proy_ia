import requests
from pyrenaper.pyrenaper.renaper import Renaper
from modelo_ia import procesar_datos_renaper  # Asegúrate de tener este módulo

# Configuración
API_RENAPER_KEY = "TU_API_KEY"
API_RENAPER_URL = "https://tu-api-renaper.com/api/dni"
DNI = "12345678"
GENERO = "M"  # 'M' o 'F'

# Inicializar pyrenaper
renaper = Renaper(api_key=API_RENAPER_KEY)

# Paso 1: Obtener datos de la API (modo directo si es externo)
def obtener_datos_renaper(dni, genero):
    response = renaper.get_dni_data(dni, genero)
    if response.get("status") == "success":
        return response["data"]
    else:
        print("Error al obtener datos:", response.get("message"))
        return None

# Paso 2: Procesar datos con tu IA
def ejecutar_proceso_ia(dni, genero):
    datos = obtener_datos_renaper(dni, genero)
    if datos:
        resultado_ia = procesar_datos_renaper(datos)
        print("Resultado del modelo IA:", resultado_ia)
        # Aquí puedes guardar en base de datos o enviar a otro endpoint
    else:
        print("No se pudo procesar el DNI.")

# Ejecutar
if __name__ == "__main__":
    ejecutar_proceso_ia(DNI, GENERO)
