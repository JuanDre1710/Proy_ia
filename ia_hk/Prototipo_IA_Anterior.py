import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# 1. Crear un dataset simulado
np.random.seed(42)

# Simulamos 1000 clientes
n = 1000
data = pd.DataFrame({
    'edad': np.random.randint(18, 70, size=n),
    'monto_reclamo': np.random.normal(5000, 2500, size=n).astype(int),
    'n_reclamos': np.random.poisson(2, size=n),
    'dias_desde_ultimo': np.random.randint(0, 365, size=n),
})

# Generar etiquetas con cierta lógica (si cumple muchos factores = fraude)
data['fraude'] = (
    (data['monto_reclamo'] > 8000) &
    (data['n_reclamos'] > 3) &
    (data['dias_desde_ultimo'] < 30)
).astype(int)

# 2. Exploración básica
print(data.head())
sns.pairplot(data, hue="fraude")
plt.show()

# 3. Separar variables
X = data.drop('fraude', axis=1)
y = data['fraude']

# 4. Dividir en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Modelo: Random Forest
modelo = RandomForestClassifier(n_estimators=100, random_state=42)
modelo.fit(X_train, y_train)

# 6. Predicción y evaluación
y_pred = modelo.predict(X_test)

print("Reporte de Clasificación:\n", classification_report(y_test, y_pred))
print("Matriz de Confusión:\n", confusion_matrix(y_test, y_pred))
print("AUC-ROC:", roc_auc_score(y_test, modelo.predict_proba(X_test)[:, 1]))

# 7. Importancia de variables
importancias = pd.Series(modelo.feature_importances_, index=X.columns)
importancias.sort_values().plot(kind="barh", title="Importancia de características")
plt.show()
