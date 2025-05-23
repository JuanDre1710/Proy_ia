# === predictor_fraude.py ===
from modelos.modelo_memoria import modelo

# Clasificación textual basada en score
def clasificar(score):
    if score < 0.33:
        return "Normal"
    elif score < 0.66:
        return "Requiere revisión"
    else:
        return "Sospechoso de fraude"

def predecir_caso(input_dict):
    score = modelo.predict_proba_one(input_dict).get(1, 0)
    clasificacion = clasificar(score)
    return {
        "score": int(score * 100),
        "clasificacion": clasificacion,
        "explicacion": list(input_dict.keys())[:3]  # explicación simple
    }
