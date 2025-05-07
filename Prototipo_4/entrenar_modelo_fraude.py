import pandas as pd
import os
import zipfile
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import numpy as np

# === 1. Extraer y leer Excel ===

# Ruta al ZIP y a carpeta de extracción

#zip_path = r"C:\Users\Jdre\source\Proy_ia\archive.zip"
excel_path = os.path.join(os.path.dirname(__file__), 'archive', 'datasets.xlsx')


# Extraer ZIP si no está ya descomprimido
#if not os.path.exists(extract_path):
#    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
#        zip_ref.extractall(extract_path)

# Buscar archivo Excel
#archivos = os.listdir(extract_path)
#excel_files = [f for f in archivos if f.endswith(('.xlsx', '.xls'))]
#if not excel_files:
#    raise FileNotFoundError("No se encontró un archivo Excel en la carpeta extraída.")

# Leer Excel
#excel_path = os.path.join(extract_path, excel_files[0])
df = pd.read_excel(excel_path)

print("Primeras filas del dataset:")
print(df.head())

# === 2. Preprocesamiento básico ===

# Opcional: revisar nombres de columnas
print("\nColumnas disponibles:", df.columns)

# Elimina columnas que no aportan (ajustar según dataset)
if 'policy_number' in df.columns:
    df.drop(columns=['policy_number'], inplace=True)

# Conversión de dataTipo porque randomforest no lo puede procesar
df['fecha'] = pd.to_datetime(df['incident_date'])  # Convierte la columna a datetime
df['anio'] = df['fecha'].dt.year
df['mes'] = df['fecha'].dt.month
df['dia'] = df['fecha'].dt.day
df['dia_semana'] = df['fecha'].dt.weekday
df.drop(columns=['fecha'], inplace=True)  # Elimina la columna original


# Codificación de variables categóricas
label_encoders = {}
for column in df.select_dtypes(include='object').columns:
    #Convertir valores nulos ilegibles
    df[column].fillna('Desconocido', inplace=True)

    #revisar tipo de datos de la columna
    print(f"Columna: {column} - Tipo de datos: {df[column].dtype}")
    print(f"Valores únicos: {df[column].unique()}")

    # Asegurar que todos los valores sean cadenas
    df[column] = df[column].astype(str)

    le = LabelEncoder()
    df[column] = le.fit_transform(df[column])
    label_encoders[column] = le

# Asegura que todas las columnas de tipo fecha sean convertidas a numéricas
for col in df.select_dtypes(include='datetime64').columns:
    df[col + '_anio'] = df[col].dt.year
    df[col + '_mes'] = df[col].dt.month
    df[col + '_dia'] = df[col].dt.day
    df.drop(columns=[col], inplace=True)


# === 3. Entrenamiento del modelo ===

# Separar variables independientes (X) y dependiente (y)
X = df.drop('fraud_reported', axis=1)
y = df['fraud_reported']

# Dividir en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Modelo
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluación
y_pred = clf.predict(X_test)
print("\nReporte de clasificación:")
print(classification_report(y_test, y_pred))

# === 4. Guardar el modelo entrenado ===
joblib.dump(clf, "modelo_fraude.pkl")
print("\n✅ Modelo guardado como 'modelo_fraude.pkl'")
