# === modelo_watcher.py ===
# Watchdog para recargar modelo River si cambia el archivo JSON

import time
import os
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from modelos.modelo_memoria import cargar_modelo_json

class ModeloEventHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("modelo_fraude_river.json"):
            print(f"📁 Modelo modificado: {event.src_path}")
            cargar_modelo_json()

def iniciar_watcher():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../modelo"))
    event_handler = ModeloEventHandler()
    observer = Observer()
    observer.schedule(event_handler, path=path, recursive=False)
    observer.start()
    print(f"👀 Watchdog iniciado en: {path}")
    return observer
