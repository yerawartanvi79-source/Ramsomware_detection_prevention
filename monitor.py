from watchdog.events import FileSystemEventHandler
from detector import detect_ransomware
from backup import backup_files, restore_files


class FileMonitor(FileSystemEventHandler):

    def process(self, event_type):

        result = detect_ransomware(event_type)

        if result == "ransomware":

            print("⚠️ Ransomware detected!")
            print("Stopping attack and restoring files...")

            restore_files()

            print("System protected.")
            exit()

        else:

            backup_files()
            print(f"Event: {event_type}")


    def on_created(self, event):
        if not event.is_directory:
            self.process("create")

    def on_modified(self, event):
        if not event.is_directory:
            self.process("modify")

    def on_deleted(self, event):
        if not event.is_directory:
            self.process("delete")