import time
from watchdog.observers import Observer
from monitor import FileMonitor

path = "test_folder"

event_handler = FileMonitor()
observer = Observer()
observer.schedule(event_handler, path, recursive=True)

print("Monitoring started...")

observer.start()

try:
    while True:
        time.sleep(1)

except KeyboardInterrupt:
    observer.stop()
    print("Monitoring stopped")

observer.join()