import pyodbc
import datetime

# Conexión a la base de datos origen (lectura)
conn_origen = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=vm2016macrodi;"
    "DATABASE=iSol_Macro_NET_DES;"
    "UID=innovacion;"
    "PWD=innovacion;"
)
cursor_origen = conn_origen.cursor()

# Conexión a la base de datos destino (escritura)
conn_destino = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=vm2022SQL2022;"
    "DATABASE=Innovacion;"
    "UID=innovacion;"
    "PWD=innovacion;"
)
cursor_destino = conn_destino.cursor()

# Paso 1: Leer datos desde la base de origen
query = """
	SELECT C.CLI_ID, C.CLI_NRODOC, C.CLI_NOMBRE, C.CLI_APELLIDO, C.CLI_FECNAC, V.VDO_CODIGO, VD.VDO_DESCRIPCION, VDO.VDO_ABREVIATURA, CLM_MAIL FROM EXT_CLIENTES C
INNER JOIN EXT_CLIENTES_DOMICILIO CD
    ON C.CLI_ID = CD.CLI_ID
INNER JOIN VALORES_DOMINIOS V
    ON C.VDO_IDSEXO = V.VDO_ID
INNER JOIN VALORES_DOMINIOS VD
    ON C.VDO_ESTCIVIL = VD.VDO_ID
INNER JOIN VALORES_DOMINIOS VDO
    ON C.VDO_PAIS = VDO.VDO_ID
INNER JOIN EXT_CLIENTES_MAILS M
    ON C.CLI_ID = M.CLI_ID
"""
cursor_origen.execute(query)
datos = cursor_origen.fetchall()

# Paso 2: Lógica simple de "fraude" como ejemplo
def detectar_fraude(nombre, apellido, email, nro_documento):
    # Lógica de fraude (ejemplo): si el CUIL no tiene 11 dígitos o hay nombres sospechosos
    if email is None or not ("@" in email):
        print(f"Fraude detectado en cliente {nro_documento} - sin mail.")
        return True
    if nombre.upper() in ['TEST', 'PRUEBA'] or apellido.upper() in ['FAKE', 'FRAUDE']:
        return True
    return False

# Paso 3: Insertar en base de datos destino si es fraude
for dato in datos:
    cli_id, nro_documento, nombre, apellido, fecha_nacimiento, genero_id, estadoCivil_id, nacionalidad, email = dato
    telefono=None

    if detectar_fraude(nombre, apellido, email, nro_documento):
        cursor_destino.execute("""
    INSERT INTO AlertasFraude (
        AlertaID, cli_id, FechaGeneracion, ScoreRiesgo, MotivoDeteccion, Revisado
    ) 
    VALUES (?, ?, ?, ?, ?, ?)
""", 
cli_id, nro_documento, datetime.datetime.now(), 'Riesgo Alto', 'Fraude detectado', False
)



        print(f"[FRAUDE] {nombre} {apellido} insertado.")
    else:
        # Si NO es fraude, lo guarda en la tabla Clientes
        cursor_destino.execute("""
            INSERT INTO Clientes (
                nro_documento, nombre, apellido, fecha_nacimiento, genero_id,
                estadoCivil_id, nacionalidad, email, telefono, fecha_registro
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, 
        nro_documento, nombre, apellido, fecha_nacimiento,
        genero_id, estadoCivil_id, nacionalidad, email, telefono, datetime.datetime.now().date()
        )

        print(f"[CLIENTE] {nombre} {apellido} insertado.")

    conn_destino.commit()

    # Cerrar conexiones
    cursor_origen.close()
    conn_origen.close()
    cursor_destino.close()
    conn_destino.close()
