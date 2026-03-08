import time

events = []

TIME_WINDOW = 5
EVENT_THRESHOLD = 20


def detect_ransomware(event_type):

    global events

    if event_type not in ["create", "modify"]:
        return "benign"

    current_time = time.time()

    events.append(current_time)

    events[:] = [t for t in events if current_time - t <= TIME_WINDOW]

    if len(events) >= EVENT_THRESHOLD:
        events.clear()
        return "ransomware"

    return "benign"