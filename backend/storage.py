import os
import json

BASE_DIR = "data/users"


def ensure_user(user_id):
    user_dir = os.path.join(BASE_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)

    defaults = {
        "session.json": {
            "state": None,
            "clock_in_time": None,
            "clock_out_time": None,
            "pending_event": None
        },
        "tasks.json": [],
        "events.json": [],
        "achievements.json": [],
        "medals.json": []
    }

    for filename, default_data in defaults.items():
        path = os.path.join(user_dir, filename)
        if not os.path.exists(path):
            with open(path, "w") as f:
                json.dump(default_data, f, indent=2)

    return user_dir


def read_json(user_id, filename):
    ensure_user(user_id)
    path = os.path.join(BASE_DIR, user_id, filename)
    with open(path, "r") as f:
        return json.load(f)


def write_json(user_id, filename, data):
    ensure_user(user_id)
    path = os.path.join(BASE_DIR, user_id, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)