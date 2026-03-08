import psutil

def stop_encryption():

    print("⚠️ Ransomware detected. Attempting to stop suspicious processes...")

    for process in psutil.process_iter():

        try:
            process_name = process.name().lower()

            # simple suspicious keyword check
            if "encrypt" in process_name or "ransom" in process_name:

                print("Terminating process:", process_name)

                process.kill()

        except:
            pass

    print("Protection system executed.")