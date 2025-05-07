import pyodbc

class Cliente:
    def __init__(self, nombre=None, apellido=None, dni=None, nacionalidad=None):
        # Inicializar los atributos del cliente
        self.nombre = nombre
        self.apellido = apellido
        self.dni = dni
        self.nacionalidad = nacionalidad

    def __str__(self):
        # Método para mostrar los datos del cliente
        return f"Cliente(nombre={self.nombre}, apellido={self.apellido}, dni={self.dni}, nacionalidad={self.nacionalidad})"

    @classmethod
    def cargar_datos(cls):
        # Solicitar datos por teclado y crear un nuevo objeto Cliente
        nombre = input("Ingrese el nombre (puede dejarlo vacío): ").strip() or None
        apellido = input("Ingrese el apellido (puede dejarlo vacío): ").strip() or None
        dni = input("Ingrese el DNI (requerido): ").strip()
        nacionalidad = input("Ingrese la nacionalidad (puede dejarlo vacío): ").strip() or None
        
        # Crear y retornar un objeto Cliente
        return cls(nombre, apellido, dni, nacionalidad)

    def verificar_cliente(self, conn):
        # Conexión a la base de datos
        cursor = conn.cursor()
        
        # Crear la consulta SQL para verificar si el cliente existe
        query = """
        SELECT * FROM Clientes C
        INNER JOIN Valores_Dominios V ON C.nac_VD_id = V.vdo_id
        WHERE (C.nombre = ? OR ? IS NULL)
        OR (C.apellido = ? OR ? IS NULL)
        OR (C.nro_documento = ?)
        OR (V.vdo_descripcion = ? OR ? IS NULL)
        """
        
        # Ejecutar la consulta con los datos del cliente
        cursor.execute(query, self.nombre, self.nombre, self.apellido, self.apellido, self.dni, self.nacionalidad, self.nacionalidad)
        
        # Obtener los resultados
        cliente = cursor.fetchone()
        
        if cliente:
            # Si se encuentra el cliente, imprimir los datos
            print(f"Cliente encontrado: {cliente}")
        else:
            # Si no se encuentra, imprimir que no es cliente
            print("No es cliente")
        
        # Cerrar el cursor
        cursor.close()
        return cliente
        


# Conexión a la base de datos SQL Server
def Prueba():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=vm2022SQL2022;DATABASE=Innovacion;"
        "UID=innovacion;PWD=innovacion;"
    )

    # Ejemplo de uso
    cliente = Cliente.cargar_datos()  # Crear un objeto Cliente con los datos ingresados por teclado
    cliente.verificar_cliente(conn)  # Llamar al método verificar_cliente para comprobar si el cliente existe

    # Cerrar la conexión a la base de datos
    conn.close()
    return cliente


if '__init__' == '__main__':
    Prueba()








