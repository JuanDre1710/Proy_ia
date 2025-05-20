from utiles.carga import cargar_bd

def mostrar_clientes(conn):
    conn = cargar_bd()

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Clientes")

    for fila in cursor.fetchall():
        print(fila)
    cursor.close()
    conn.close()      


if __name__ == '__main__':
    mostrar_clientes()