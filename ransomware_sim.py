import os, time, random

folder = "test_folder"
print("ransomware_sim.py running — simulating encryption...")

while True:
    for i in range(30):
        try:
            with open(f"{folder}/file{random.randint(1,30)}.txt", "wb") as f:
                f.write(bytes([random.randint(0,255) for _ in range(500)]))
        except:
            pass
    time.sleep(0.05)