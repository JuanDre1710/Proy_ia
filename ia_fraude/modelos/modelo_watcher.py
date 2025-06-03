import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Ruta al modelo real (pkl)
modelo_path = os.path.join(os.path.dirname(__file__), "../../modelo/modelo_fraude_river.pkl")

class ModeloEventHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("modelo_fraude_river.pkl"):
            print("\n🔄 ¡Atención! El modelo ha sido modificado externamente.")
            print("   (Podés recargarlo manualmente si querés usarlo ahora mismo)")

def iniciar_watcher():
    observer = Observer()
    observer.schedule(ModeloEventHandler(), path=os.path.dirname(modelo_path), recursive=False)
    observer.start()
    print("👀 Watcher iniciado para detectar cambios en el modelo")
    return observer
