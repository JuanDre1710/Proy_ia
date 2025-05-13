
import json
import random
import uuid
from typing import List

# Cargar el padrón simulado para uso en memoria
with open("padron_simulado_renaper.json", "r", encoding="utf-8") as f:
    PADRON = json.load(f)

class Selfie:
    def __init__(self, image: str, type: str):
        self.image = image
        self.type = type

class RenaperSandbox:
    def __init__(self):
        self.operaciones = {}  # operation_id -> dni

    def new_operation(self, number: int, gender: str, ip: str, browser_fingerprint: str) -> str:
        op_id = str(uuid.uuid4())
        self.operaciones[op_id] = {"dni": str(number), "sexo": gender.upper()}
        return op_id

    def _validar_operacion(self, op_id: str, number: int, gender: str):
        op = self.operaciones.get(op_id)
        if not op:
            raise ValueError("Operación no encontrada")
        if op["dni"] != str(number) or op["sexo"] != gender.upper():
            raise ValueError("Los datos no coinciden con la operación")

    def _buscar_persona(self, dni: str):
        for persona in PADRON:
            if persona["dni"] == dni:
                return persona
        return {
            "nombre": "NOMBRE FICTICIO",
            "apellido": "APELLIDO FICTICIO",
            "dni": dni,
            "sexo": "M",
            "fecha_nacimiento": "1970-01-01",
            "edad": 54,
            "fallecido": False,
            "domicilio": {
                "calle": "Falsa",
                "numero": "123",
                "barrio": "Simulación",
                "localidad": "Ciudad Test",
                "provincia": "Córdoba"
            },
            "estado": "HABILITADO"
        }

    def add_back(self, operation_id: str, number: int, gender: str, file: str,
                 analyze_anomalies: bool = False, analyze_ocr: bool = False) -> dict:
        self._validar_operacion(operation_id, number, gender)
        return {"status": "ok", "mensaje": "Dorso recibido"}

    def add_front(self, operation_id: str, number: int, gender: str, file: str,
                  analyze_anomalies: bool = False, analyze_ocr: bool = False) -> dict:
        self._validar_operacion(operation_id, number, gender)
        return {"status": "ok", "mensaje": "Frente recibido"}

    def register(self, operation_id: str, number: int, gender: str, selfie_list: List[Selfie]) -> dict:
        self._validar_operacion(operation_id, number, gender)
        persona = self._buscar_persona(str(number))
        return persona
