from pyrenaper import Renaper
from pyrenaper.environments import ONBOARDING

def main():
    # --- INICIALIZACIÓN ---
    # Clave del paquete 3 (reemplazala por la tuya)
    PACKAGE_3_API_KEY = "TU_API_KEY_DEL_PACKAGE_3"

    renaper = Renaper(
        ONBOARDING,
        package_3=PACKAGE_3_API_KEY
    )

    print("🔎 Consulta de datos a RENAPER (Paquete 3)")
    try:
        # --- INPUT DEL USUARIO ---
        dni = int(input("Ingresá el número de DNI: "))
        genero = input("Ingresá el género (M o F): ").strip().upper()
        tramite = int(input("Ingresá el número de trámite (orden): "))

        # --- CONSULTA A RENAPER ---
        response = renaper.person_data(
            number=dni,
            gender=genero,
            order=tramite
        )

        # --- RESULTADO ---
        if response.status:
            print("\n✅ Consulta exitosa:")
            print(response.response)  # JSON con los datos del ciudadano
        else:
            print(f"\n❌ Error {response.code}: {response.message}")
    except Exception as e:
        print(f"⚠️ Error inesperado: {e}")

if __name__ == "__main__":
    main()
