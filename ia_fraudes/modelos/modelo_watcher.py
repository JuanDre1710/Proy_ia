import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from predictor_fraude import recargar_modelo

class ModeloEventHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("modelo_fraude.pkl") or event.src_path.endswith("label_encoders.pkl"):
            print(f"📁 Cambio detectado en: {event.src_path}")
            recargar_modelo()

def iniciar_watcher():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../modelo"))
    event_handler = ModeloEventHandler()
    observer = Observer()
    observer.schedule(event_handler, path=path, recursive=False)
    observer.start()
    print(f"👀 Watchdog iniciado en carpeta: {path}")
    return observer
