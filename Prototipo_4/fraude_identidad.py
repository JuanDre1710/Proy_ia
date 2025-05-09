# fraude_identidad.py
from datetime import datetime

def calcular_edad(fecha_nacimiento):
    hoy = datetime.today()
    try:
        fecha = datetime.strptime(fecha_nacimiento, "%Y-%m-%d")
        edad = hoy.year - fecha.year - ((hoy.month, hoy.day) < (fecha.month, fecha.day))
        return edad
    except Exception:
        return None

def evaluar_identidad(datos):
    """
    datos: dict con claves como dni, nombre, apellido, fecha_nacimiento, sexo, estado_civil, fallecido
    """
    score = 0
    motivos = []

    # Fallecido
    if datos.get("fallecido", False):
        score += 100
        motivos.append("Persona figura como fallecida en RENAPER")

    # Edad < 18
    edad = datos.get("edad") or calcular_edad(datos.get("fecha_nacimiento"))
    if edad is not None:
        if edad < 18:
            score += 40
            motivos.append(f"Edad reportada menor a 18 años ({edad})")
    else:
        score += 20
        motivos.append("Edad no disponible o fecha de nacimiento inválida")

    # Estado civil ausente
    if not datos.get("estado_civil"):
        score += 10
        motivos.append("Estado civil no informado")

    # Sexo ausente
    if not datos.get("sexo"):
        score += 10
        motivos.append("Sexo no informado")

    # Nombre o apellido vacíos
    if not datos.get("nombre") or not datos.get("apellido"):
        score += 20
        motivos.append("Nombre o apellido no disponibles")

    # Clasificación según score
    if score >= 80:
        clasificacion = "Sospechoso"
    elif score >= 40:
        clasificacion = "Requiere revisión"
    else:
        clasificacion = "Normal"

    return {
        "score": score,
        "clasificacion": clasificacion,
        "motivos": motivos
    }
