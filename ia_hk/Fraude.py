#ENTRADAS
from Llamada_Base_SQL import Cliente

from Llamada_API_renaper import Procesar_cliente

cliente=Cliente.Prueba()
Procesar_cliente(cliente)

#PROCESO

#SALIDAS
from Prototipo_4.modelo_fraude import es_fraude

if es_fraude(cliente):
    print("⚠️ FRAUDE DETECTADO.")
else:
    print("✅ Cliente legítimo.")