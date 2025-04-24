# renaper_query.py

from pyrenaper import Renaper
from pyrenaper import ONBOARDING

# 🔐 Reemplazá con tu API Key real
API_KEY = "TU_API_KEY_DEL_PAQUETE_1"

# Inicializar cliente RENAPER
renaper = Renaper(ONBOARDING, package_1=API_KEY)

def buscar_persona(dni=None, nombre=None, apellido=None, genero=None):
    try:
        respuesta = renaper.search_person(
            number=dni,
            name=nombre,
            last_name=apellido,
            gender=genero
        )

        if respuesta.ok:
            print("✅ Datos encontrados:")
            print(respuesta.response)
        else:
            print("❌ Error en la búsqueda:")
            print(f"Código: {respuesta.code}")
            print(f"Mensaje: {respuesta.message}")

    except Exception as e:
        print("⚠️ Ocurrió un error al consultar la API:", e)

# main.py

from renaper_query import buscar_persona

print("🔎 Ingresá al menos uno de los siguientes datos para buscar:")
dni = int(input("DNI (opcional): "))
nombre = input("Nombre (opcional): ")
apellido = input("Apellido (opcional): ")
genero = input("Género (M/F) (opcional): ")

dni = int(dni) if dni.isdigit() else None
nombre = nombre if nombre else None
apellido = apellido if apellido else None
genero = genero.upper() if genero else None

buscar_persona(dni=dni, nombre=nombre, apellido=apellido, genero=genero)

