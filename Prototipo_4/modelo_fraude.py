# modelo_fraude.py
import joblib
import pandas as pd

def cargar_modelo():
    modelo = joblib.load('modelo_fraude.pkl')
    columnas = joblib.load('modelo_fraude_columns.pkl')
    return modelo, columnas

def es_fraude(cliente):
    modelo, columnas_modelo = cargar_modelo()

    # Preparar datos del cliente
    datos_cliente = {
        'dni': [int(cliente.dni)],
        'nacionalidad': [cliente.nacionalidad],
        'sexo': [getattr(cliente, 'sexo', None)],
        'edad': [getattr(cliente, 'edad', None)],
    }

    df_cliente = pd.DataFrame(datos_cliente)
    df_cliente = pd.get_dummies(df_cliente)

    # Alinear con columnas del modelo
    for col in columnas_modelo:
        if col not in df_cliente:
            df_cliente[col] = 0
    df_cliente = df_cliente[columnas_modelo]

    # Predicción
    pred = modelo.predict(df_cliente)
    return pred[0] == 1
