def validar_input(data, requiere_label=False):
    if not isinstance(data, dict):
        raise ValueError("El input debe ser un JSON objeto.")
    if requiere_label and "fraude_confirmado" not in data:
        raise ValueError("Falta la etiqueta 'fraude_confirmado' para reentrenar.")
