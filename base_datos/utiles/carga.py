from dotenv import load_dotenv
import os
import pyodbc

def cargar_bd():
    # Cargar variables del .env
    load_dotenv()

    # Leer las variables (deben estar definidas en el .env))
    server = os.getenv("SQL_SERVER_16")
    database = os.getenv("SQL_DATABASE_16")
    username = os.getenv("SQL_USERNAME")
    password = os.getenv("SQL_PASSWORD")

    # Conexion
    conn = pyodbc.connect(
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={server};DATABASE={database};UID={username};PWD={password};"
        "Encrypt=yes;TrustServerCertificate=yes;"
    )
    # Leer las variables (deben estar definidas en el .env))
    server = os.getenv("SQL_SERVER_16")
    database = os.getenv("SQL_DATABASE_16")
    username = os.getenv("SQL_USERNAME")
    password = os.getenv("SQL_PASSWORD")

    # Conexion
    conn = pyodbc.connect(
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={server};DATABASE={database};UID={username};PWD={password};"
        "Encrypt=yes;TrustServerCertificate=yes;"
    )
    return conn

if __name__ == '__main__':
    conn = cargar_bd()