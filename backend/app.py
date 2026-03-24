from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

from storage import ensure_user, read_json, write_json
from logic import (
    looks_like_event,
    extract_time,
    extract_location,
    generate_event_name,
    break_goal_into_tasks
)
from medal import create_medal

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({"message": "Shift AI backend is running"})


@app.route("/clock-in", methods=["POST"])
def clock_in():
    data = request.get_json()
    user_id = data["user_id"]

    ensure_user(user_id)

    session = read_json(user_id, "session.json")
    session["state"] = "awaiting_goals"
    session["clock_in_time"] = datetime.now().isoformat()
    session["clock_out_time"] = None
    session["pending_event"] = None
    write_json(user_id, "session.json", session)

    return jsonify({
        "message": "Clock-in recorded.",
        "prompt": "What would you like to accomplish today?"
    })


@app.route("/clock-out", methods=["POST"])
def clock_out():
    data = request.get_json()
    user_id = data["user_id"]

    session = read_json(user_id, "session.json")
    session["state"] = "awaiting_reflection"
    session["clock_out_time"] = datetime.now().isoformat()
    write_json(user_id, "session.json", session)

    return jsonify({
        "message": "Clock-out recorded.",
        "prompt": "Tell me 3 achievements from today separated by semicolons."
    })


@app.route("/message", methods=["POST"])
def message():
    data = request.get_json()
    user_id = data["user_id"]
    text = data["text"].strip()

    session = read_json(user_id, "session.json")
    state = session["state"]

    if state is None:
        return jsonify({"error": "Please clock in first."}), 400

    if state == "awaiting_event_details":
        pending = session["pending_event"]
        event_time = extract_time(text) or pending.get("time")
        location = extract_location(text) or pending.get("location")

        if not event_time or not location:
            missing = []
            if not event_time:
                missing.append("time")
            if not location:
                missing.append("location")

            return jsonify({
                "response": f"I still need: {', '.join(missing)}."
            })

        events = read_json(user_id, "events.json")
        events.append({
            "name": generate_event_name(pending["description"]),
            "description": pending["description"],
            "time": event_time,
            "location": location
        })
        write_json(user_id, "events.json", events)

        session["state"] = "collecting_items"
        session["pending_event"] = None
        write_json(user_id, "session.json", session)

        return jsonify({
            "response": "Event added. You can send another goal or event."
        })

    if state in ["awaiting_goals", "collecting_items"]:
        if looks_like_event(text):
            event_time = extract_time(text)
            location = extract_location(text)

            if not event_time or not location:
                session["state"] = "awaiting_event_details"
                session["pending_event"] = {
                    "description": text,
                    "time": event_time,
                    "location": location
                }
                write_json(user_id, "session.json", session)

                missing = []
                if not event_time:
                    missing.append("time")
                if not location:
                    missing.append("location")

                return jsonify({
                    "response": f"That sounds like an event. I need: {', '.join(missing)}."
                })

            events = read_json(user_id, "events.json")
            events.append({
                "name": generate_event_name(text),
                "description": text,
                "time": event_time,
                "location": location
            })
            write_json(user_id, "events.json", events)

            return jsonify({
                "response": "Event added."
            })

        tasks = read_json(user_id, "tasks.json")
        new_tasks = break_goal_into_tasks(text)

        for task in new_tasks:
            tasks.append({
                "title": task,
                "completed": False
            })

        write_json(user_id, "tasks.json", tasks)

        session["state"] = "collecting_items"
        write_json(user_id, "session.json", session)

        return jsonify({
            "response": "Goal added and broken into tasks.",
            "tasks_created": new_tasks
        })

    if state == "awaiting_reflection":
        parts = [p.strip() for p in text.split(";") if p.strip()]

        if len(parts) < 3:
            return jsonify({
                "response": "Please send 3 achievements separated by semicolons."
            })

        write_json(user_id, "achievements.json", parts[:3])

        medal_path = create_medal(user_id, parts[:3])

        medals = read_json(user_id, "medals.json")
        medals.append({
            "image_path": medal_path,
            "caption": "Daily achievement medal"
        })
        write_json(user_id, "medals.json", medals)

        session["state"] = "completed"
        write_json(user_id, "session.json", session)

        return jsonify({
            "response": "Great job today. Your medal was created and saved.",
            "medal_path": medal_path
        })

    return jsonify({"response": "Session is complete."})


@app.route("/tasks/<user_id>", methods=["GET"])
def get_tasks(user_id):
    return jsonify(read_json(user_id, "tasks.json"))


@app.route("/events/<user_id>", methods=["GET"])
def get_events(user_id):
    return jsonify(read_json(user_id, "events.json"))


@app.route("/album/<user_id>", methods=["GET"])
def get_album(user_id):
    return jsonify(read_json(user_id, "medals.json"))


@app.route("/medals/<path:filename>", methods=["GET"])
def serve_medal(filename):
    return send_from_directory("medals", filename)


if __name__ == "__main__":
    app.run(debug=True)