#  ERS - Modulo de IA para Detección de Fraude

Este modulo implementa una API REST desarrollada en **FastAPI** que utiliza un modelo de aprendizaje incremental (online) basado en **River** para detectar posibles fraudes en siniestros asegurables. Forma parte del sistema ERS (Evaluador de Riesgo de Siniestros).

## Estructura del Proyecto

ia_fraude/
├── app.py # Modulo principal (FastAPI)
├── modelos/
│ ├── predictor_fraude.py # Predicción y scoring de fraude
│ ├── modelo_memoria.py # Carga del modelo desde .pkl
│ ├── modelo_watcher.py # Watchdog para recargar el modelo si cambia
│ ├── entrenador_fraude.py # Reentrenamiento incremental del modelo
│ └── entrenar_reentrenar/
│ └── entrenar_modelo_fraude.py # Entrenamiento inicial desde Excel
├── utils/
│ ├── schema.py # Esquema Pydantic de entrada
│ └── validadores.py # Validaciones opcionales
modelo/
├── modelo_fraude_river.pkl # Modelo binario entrenado
├── modelo_fraude_river.json # Metadatos del modelo

---

## ¿Qué hace?

El modulo proporciona dos endpoints clave:

### 1. `/evaluar` → **Predice si un caso es fraudulento**
    - Calcula un **score** de 0 a 100
    - Clasifica como:
    - `Normal` (score < 33)
    - `Requiere revisión` (33 ≤ score < 66)
    - `Sospechoso de fraude` (score ≥ 66)
    -  Devuelve una **explicación** heurística de las variables más relevantes

### 2. `/reentrenar` → **Actualiza el modelo con un nuevo caso**
- Se le pasa el mismo formato que `/evaluar`, con el campo adicional `fraude_confirmado` (`0` o `1`)
- El modelo se actualiza en memoria y queda disponible inmediatamente
- También se guarda en disco (`modelo_fraude_river.pkl`)

---

## ¿Cómo funciona internamente?

- El modelo es un **BaggingClassifier de árboles Hoeffding** (River), entrenado en modo incremental.
- Las variables categóricas ya vienen codificadas como `int`.
- Las variables booleanas se procesan desde `"True"`/`"False"` a `bool`.

### Explicaciones
Las explicaciones se generan con reglas heurísticas predefinidas (por ejemplo, `"zona_de_riesgo" = True` genera alerta).

---

## Requisitos y Librerías

Este modulo depende de las siguientes librerías clave:

| Librería       | Función                                                                 |
|----------------|------------------------------------------------------------------------|
| `fastapi`      | Framework principal para la API REST                                   |
| `uvicorn`      | Servidor ASGI para correr FastAPI                                       |
| `pydantic`     | Validación de datos de entrada mediante esquemas                       |
| `pandas`       | Manipulación de datos tabulares (para carga inicial desde Excel)       |
| `openpyxl`     | Soporte de archivos `.xlsx` para `pandas.read_excel()`                 |
| `river`        | Entrenamiento incremental de modelos (online machine learning)         |
| `watchdog`     | Detecta cambios en el archivo del modelo para recargar automáticamente |
| `pickle`       | Serialización del modelo `.pkl` en disco                               |
| `json`         | Exporta y carga metadatos del modelo entrenado                         |

---

## ¿Cómo correrlo?

1. Asegurate de tener el entorno virtual activado
2. Asegurate de tener los requerimientos o dependencias instaladas
3. Ejecutá el servidor con:

```bash
python ia_fraude/app.py

Con esto la API ya esta disponible en el Endpoint:(http://localhost:8000/docs)
---

## Ejemplos de arreglos para pasarle al Endpoint

Para /entrenar:

{
  "cliente_id": 112233,
  "monto_reclamado": 120000,
  "zona_de_riesgo": "True",
  "dias_desde_inicio_poliza": 2,
  "cantidad_siniestros_previos": 5
}

Para /reentrenar:

{
  "cliente_id": 112233,
  "monto_reclamado": 120000,
  "zona_de_riesgo": "True",
  "dias_desde_inicio_poliza": 2,
  "cantidad_siniestros_previos": 5,
  "fraude_confirmado": 1
}

---

## ¿Cómo se entrena?

El modelo de IA esta entrenado en un principio con un dataset historico con casos de fraude y patrones ("daatset_entrenamiento_corregido.xlsx") con columnas convertidas en (bool, int, float) que la IA analiza y despues reproduce en el analisis de los arreglos que le pasemos. Este entrenamiento se guarda en el "modelos_fraude_river.pkl" y se actualiza por cada vez que utilizamos la función del endpoint.

A su vez al estar programado con las librerias de River, nos permite un entrenamiento más enfocado a las alertas que la IA deberia interpretar o ponerle el foco de atención, con la función de reentrenar del endpoint podemos pasar arreglos personalizados donde la alerta este bien clara.
Ej: {
    "cliente_id": 1000,
    "tipo_siniestro": 0,
    "cantidad_siniestros_previos": 10,
    "fraude_confirmado": 1
    }
Este ejemplo busca resaltar una alerta cuando se vea que la cantidad de siniestros previos de este cliente sea muy elevada.

---

## Observaciones

1. El modulo no requiere de una base de datos, es standlone.
2. Es totalmente compatible con fronteds de Angular, React, etc.
3. Diseño modular y escalable.

Todas estas observaciones reflejan que el modulo puede trabajar por su cuenta pero con la integracion de un Backend para eficientizar su utilidad, mejora el modulo.

---

## Control

El modulo esta en constante funcionamiento mientras este levantado el host del endopoint y a su vez se reentrena constantemente con arreglos que se le pasa. Por eso la implementación de un backend que automatice todo esto lo hace mucho mas eficiente.
Para ello el modulo cuenta con una funcion de watchdog, que se mantiene alerta a alguna llamada a la API y de cualquier cambio que surja en el modelo entrenado.

---

## Adicionales

- "modelo_memoria.py": Guarda e importa el modelo de IA entreando para ponerlo en funcionamiento. (No es necesario del todo).

- "test.py": Con predictor_fraude.py como funcion principal del MS este script permite hacer pruebas del analisis que esta haciendo la IA con arreglos en formato JSON.

- "schemas.py": Refiere a los campos de variables que puede o no recibir el proceso de evalución de fraude o reentrenamiento de modelo.

- "validadores.py": verifica que la informacion que se le esta pasando al endpoint sea valida. 

---

