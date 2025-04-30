from Llamada_Base_SQL import Prueba
from Llamada_API_renaper.py import 

cliente=Prueba()



from Prototipo_4.modelo_fraude import es_fraude

if es_fraude(cliente):
    print("⚠️ FRAUDE DETECTADO.")
else:
    print("✅ Cliente legítimo.")