import shutil
import os

SOURCE_FOLDER = "test_folder"
BACKUP_FOLDER = "backup_folder"

def backup_files():

    if not os.path.exists(BACKUP_FOLDER):
        os.makedirs(BACKUP_FOLDER)

    for file in os.listdir(SOURCE_FOLDER):

        src = os.path.join(SOURCE_FOLDER, file)
        dst = os.path.join(BACKUP_FOLDER, file)

        if os.path.isfile(src):
            shutil.copy2(src, dst)


def restore_files():

    print("Restoring files from backup...")

    for file in os.listdir(BACKUP_FOLDER):

        src = os.path.join(BACKUP_FOLDER, file)
        dst = os.path.join(SOURCE_FOLDER, file)

        shutil.copy2(src, dst)

    print("Files restored!")