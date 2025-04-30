import pyodbc
import datetime

def funcion1():
    # Conexión a la base de datos origen (lectura)
    conn_origen = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=TU_SERVIDOR_ORIGEN;"
        "DATABASE=BaseDeDatosOrigen;"
        "UID=tu_usuario;"
        "PWD=tu_contraseña;"
    )
    cursor_origen = conn_origen.cursor()

    # Conexión a la base de datos destino (escritura)
    conn_destino = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=TU_SERVIDOR_DESTINO;"
        "DATABASE=BaseDeDatosDestino;"
        "UID=tu_usuario;"
        "PWD=tu_contraseña;"
    )
    cursor_destino = conn_destino.cursor()

    # Paso 1: Leer datos desde la base de origen
    query = """
    SELECT dni, genero, nombre, apellido, fecha_nacimiento, cuil
    FROM datos_personales
    """
    cursor_origen.execute(query)
    registros = cursor_origen.fetchall()

    # Paso 2: Lógica simple de "fraude" como ejemplo
    def detectar_fraude(nombre, apellido, cuil):
        # Lógica de fraude (ejemplo): si el CUIL no tiene 11 dígitos o hay nombres sospechosos
        if not cuil or len(cuil) != 11:
            return True
        if nombre.upper() in ['TEST', 'PRUEBA'] or apellido.upper() in ['FAKE', 'FRAUDE']:
            return True
        return False

    # Paso 3: Insertar en base de datos destino si es fraude
    for fila in registros:
        dni, genero, nombre, apellido, fecha_nacimiento, cuil = fila
        if detectar_fraude(nombre, apellido, cuil):
            cursor_destino.execute("""
                INSERT INTO fraudes_detectados (dni, genero, nombre, apellido, fecha_nacimiento, cuil, fecha_registro)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, dni, genero, nombre, apellido, fecha_nacimiento, cuil, datetime.datetime.now())
            print(f"[FRAUDE] {nombre} {apellido} insertado.")

    conn_destino.commit()

    # Cerrar conexiones
    cursor_origen.close()
    conn_origen.close()
    cursor_destino.close()
    conn_destino.close()
