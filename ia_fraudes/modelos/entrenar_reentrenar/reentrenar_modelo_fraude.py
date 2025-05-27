import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

def reentrenar_desde_json(data_json):
    df = pd.DataFrame(data_json)

    print(f"📊 Registros recibidos: {df.shape[0]}")

    label_encoders = {}
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].fillna("Desconocido").astype(str)
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    for col in df.select_dtypes(include=np.number).columns:
        df[col].fillna(df[col].median(), inplace=True)

    y = df["fraude_confirmado"]
    X = df.drop(columns=["fraude_confirmado"])

    X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)
    modelo = RandomForestClassifier(n_estimators=100, random_state=42)
    modelo.fit(X_train, y_train)

    y_pred = modelo.predict(X_test)
    y_prob = modelo.predict_proba(X_test)[:, 1]

    print("✅ Modelo reentrenado")
    print(classification_report(y_test, y_pred))
    print(f"AUC: {roc_auc_score(y_test, y_prob):.3f}")

    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../modelo"))
    os.makedirs(output_path, exist_ok=True)

    joblib.dump(modelo, os.path.join(output_path, "modelo_fraude.pkl"))
    joblib.dump(label_encoders, os.path.join(output_path, "label_encoders.pkl"))

    return {
        "status": "ok",
        "mensaje": "Modelo actualizado con éxito",
        "registros_usados": len(df),
        "auc": round(roc_auc_score(y_test, y_prob), 3)
    }
