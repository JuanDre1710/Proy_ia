# entrenar_modelo_fraude.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Paso 1: Crear datos simulados para entrenamiento
data = {
    'dni': [12345678, 87654321, 11223344, 99887766],
    'nacionalidad': ['Argentina', 'Brasil', 'Argentina', 'Chile'],
    'sexo': ['M', 'F', 'F', 'M'],
    'edad': [25, 40, 35, 22],
    'es_fraude': [0, 1, 0, 1]  # Etiqueta: 1=fraude, 0=no fraude
}

df = pd.DataFrame(data)

# Paso 2: Preparar datos para el modelo
X = pd.get_dummies(df.drop('es_fraude', axis=1))  # variables independientes
y = df['es_fraude']  # lo que queremos predecir

# Guardar columnas para uso futuro
joblib.dump(X.columns.tolist(), 'modelo_fraude_columns.pkl')

# Paso 3: Entrenar el modelo
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
modelo = RandomForestClassifier()
modelo.fit(X_train, y_train)

# Paso 4: Guardar el modelo entrenado
joblib.dump(modelo, 'modelo_fraude.pkl')

print("✅ Modelo entrenado y guardado como 'modelo_fraude.pkl'.")
