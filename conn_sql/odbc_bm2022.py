from dotenv import load_dotenv
import os
import pyodbc

# Cargar variables del .env
load_dotenv()

# Leer las variables (deben estar definidas en el .env))
server = os.getenv("SQL_SERVER")
database = os.getenv("SQL_DATABASE")
username = os.getenv("SQL_USERNAME")
password = os.getenv("SQL_PASSWORD")

# Conexión
conn = pyodbc.connect(
    f"DRIVER={{ODBC Driver 18 for SQL Server}};"
    f"SERVER={server};DATABASE={database};UID={username};PWD={password};"
    "Encrypt=yes;TrustServerCertificate=yes;"
)

cursor = conn.cursor()
cursor.execute("SELECT * FROM Clientes")

for fila in cursor.fetchall():
    print(fila)

cursor.close()
conn.close()
