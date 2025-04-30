from renaper import Renaper  # Suponiendo que tu archivo se llama renaper.py
from environment import ENV_PROD  # O el entorno que uses
import logging

# Crear la instancia del cliente RENAPER
cliente = Renaper(environment=ENV_PROD, package1_apikey="tu_api_key_p1", package2_apikey="tu_api_key_p2", package3_apikey="tu_api_key_p3")

def procesar_cliente(info: dict):
    """
    Recibe un diccionario con datos del cliente e invoca la función de Renaper correspondiente.
    """
    number = info.get("number")
    gender = info.get("gender")
    order = info.get("order")
    ip = info.get("ip", "127.0.0.1")
    fingerprint = info.get("fingerprint", "abc123")  # Valor de prueba

    try:
        if number and gender and order:
            print("→ Llamando a person_data()")
            return cliente.person_data(number=number, gender=gender, order=order)

        elif number and gender and ip and fingerprint:
            print("→ Llamando a new_operation()")
            return cliente.new_operation(number=number, gender=gender, ip=ip, browser_fingerprint=fingerprint)

        elif number and gender:
            print("→ Solo tenés número y género. No se puede verificar identidad completa.")
            return {"warning": "Falta 'order' para person_data() o 'ip' y 'fingerprint' para new_operation()"}

        else:
            print("→ No tenés datos suficientes para una consulta.")
            return {"error": "Se necesita al menos 'number' y 'gender'"}

    except Exception as e:
        logging.error(f"Error procesando cliente: {e}")
        return {"error": str(e)}


if __init__ == "__main__":
    info_cliente = {
        "number": 12345678,
        "gender": "M",
        "order": 1
        # "ip": "192.168.0.1",
        # "fingerprint": "abc123"
    }

    resultado = procesar_cliente(info_cliente)
    print(resultado)
