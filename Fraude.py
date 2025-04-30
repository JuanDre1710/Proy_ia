#ENTRADAS
#from Llamada_Base_SQL import Cliente
from ia_hk.Llamada_Base_SQL import Prueba
from ia_hk.Llamada_API_renaper import Procesar_cliente

cliente=Prueba()
# Procesar_cliente(cliente)

#PROCESO

#SALIDAS
from Prototipo_4.modelo_fraude import es_fraude

if es_fraude(cliente):
    print("⚠️ FRAUDE DETECTADO.")
else:
    print("✅ Cliente legítimo.")