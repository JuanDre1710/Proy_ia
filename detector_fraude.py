# detector_fraude.py

from ia_hk.Llamada_Base_SQL import Cliente
from ia_hk.Llamada_API_renaper import Procesar_cliente
from Prototipo_4.modelo_fraude import es_fraude

def main():
    dni = input("Ingrese el DNI de la persona: ")

    # Paso 1: Consultar base de datos propia

    cliente = Cliente()
    
    datos_cliente = Cliente.verificar_cliente(dni)
    if not datos_cliente:
        print("La persona no es cliente registrado.")
        return

    print("Datos obtenidos de la base:", datos_cliente)

    # Paso 2: Verificar y actualizar datos con RENAPER
    datos_verificados = Procesar_cliente(dni)
    print("Datos verificados con RENAPER:", datos_verificados)

    # Paso 3: Ejecutar modelo de fraude
    es_fraude_flag, probabilidad = es_fraude(datos_verificados)
    if es_fraude_flag:
        print(f"⚠️ POSIBLE FRAUDE DETECTADO (Probabilidad: {probabilidad:.2f})")
    else:
        print(f"✅ No se detectaron patrones sospechosos (Probabilidad: {probabilidad:.2f})")

if __name__ == "__main__":
    main()
