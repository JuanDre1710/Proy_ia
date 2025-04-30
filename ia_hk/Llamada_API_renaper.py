from pyrenaper.renaper import Renaper  # Suponiendo que tu archivo se llama renaper.py
from pyrenaper.environments import ONBOARDING  # O el entorno que uses
from Llamada_Base_SQL import Cliente 
import logging

# Instanciar la clase Renaper
renaper = Renaper(environment=ONBOARDING, package1_apikey="TU_APIKEY_1", package2_apikey="TU_APIKEY_2", package3_apikey="TU_APIKEY_3")

def Procesar_cliente(cliente: Cliente):
    # Validar si se puede hacer new_operation
    if cliente.dni and cliente.nombre and cliente.apellido:
        print("Intentando buscar datos completos con person_data...")
        try:
            resultado = renaper.person_data(number=cliente.dni, gender="M", order=1)  # El "order" es simulado acá
            print("Resultado de person_data:", resultado)
        except Exception as e:
            print("Error al llamar a person_data:", e)

    elif cliente.dni:
        print("Intentando iniciar operación con DNI solamente...")
        try:
            resultado = renaper.new_operation(
                number=cliente.dni,
                gender="M",  # Por defecto o a inferir
                ip="192.168.1.1",  # Simulado
                browser_fingerprint="test123"
            )
            print("Resultado de new_operation:", resultado)
        except Exception as e:
            print("Error en new_operation:", e)

    else:
        print("Datos insuficientes para realizar consulta.")

if "__init__" == "__main__":
    info_cliente = {
        "number": 12345678,
        "gender": "M",
        "order": 1
        # "ip": "192.168.0.1",
        # "fingerprint": "abc123"
    }

    resultado = Procesar_cliente(info_cliente)
    print(resultado)
