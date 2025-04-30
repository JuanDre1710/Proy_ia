import os
from kaggle.api.kaggle_api_extended import KaggleApi

# Asegurate de usar tu ruta exacta al archivo kaggle.json
kaggle_json_path = r'C:\Users\Jdre\.kaggle\kaggle.json'

# Configurar variables de entorno para que Kaggle pueda leer el archivo correctamente
os.environ['KAGGLE_CONFIG_DIR'] = os.path.dirname(kaggle_json_path)

# Inicializar y autenticar API
api = KaggleApi()
api.authenticate()

# Descargar dataset
api.dataset_download_files('niteshyadav3103/insurance-fraud-detection-using-12-models',
                           path='datasets', unzip=True)

print("✅ Dataset descargado y descomprimido en la carpeta 'datasets'")
