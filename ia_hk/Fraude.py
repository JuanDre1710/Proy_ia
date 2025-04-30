#ENTRADAS
#from Llamada_Base_SQL import Cliente
from Llamada_Base_SQL import Prueba
from Llamada_API_renaper import Procesar_cliente
from Prototipo_4.Prototipo_IA_4 import 

cliente=Prueba()
# Procesar_cliente(cliente)

#PROCESO

#SALIDAS
from Prototipo_4.modelo_fraude import es_fraude

if es_fraude(cliente):
    print("⚠️ FRAUDE DETECTADO.")
else:
    print("✅ Cliente legítimo.")