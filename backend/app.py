from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

from storage import ensure_user, read_json, write_json
from logic import (
    looks_like_event,
    extract_time,
    extract_location,
    generate_event_name,
    break_goal_into_tasks,
    generate_daily_tasks
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


    # Only allow clock-in if not already clocked in (must clock out first)
    from os.path import exists
    import json
    import os
    session_path = os.path.join("data", "users", user_id, "session.json")
    if exists(session_path):
        with open(session_path, "r") as f:
            try:
                session_data = json.load(f)
                state = session_data.get("state")
                # Only allow clock-in if state is 'completed' or 'awaiting_goals' (not currently clocked in)
                if state not in [None, "completed", "awaiting_goals"]:
                    return jsonify({
                        "already_clocked_in": True,
                        "message": "You must clock out before clocking in again."
                    })
            except Exception:
                pass

    session = {
        "state": "awaiting_goals",
        "clock_in_time": datetime.now().isoformat(),
        "clock_out_time": None,
        "pending_event": None
    }

    write_json(user_id, "session.json", session)
    write_json(user_id, "tasks.json", [])
    write_json(user_id, "events.json", [])
    write_json(user_id, "achievements.json", [])

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
        return jsonify({
            "response": "Please clock in first.",
            "tasks_created": [],
            "events_created": [],
            "needs_followup": False,
            "followup_type": None
        }), 400

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
                "response": f"That sounds like an event. I still need: {', '.join(missing)}.",
                "tasks_created": [],
                "events_created": [],
                "needs_followup": True,
                "followup_type": "event_details"
            })

        event_name = generate_event_name(pending["description"])

        events = read_json(user_id, "events.json")
        new_event = {
            "name": event_name,
            "description": pending["description"],
            "time": event_time,
            "location": location
        }
        events.append(new_event)
        write_json(user_id, "events.json", events)

        session["state"] = "collecting_items"
        session["pending_event"] = None
        write_json(user_id, "session.json", session)

        return jsonify({
            "response": "Event added.",
            "tasks_created": [],
            "events_created": [new_event],
            "needs_followup": False,
            "followup_type": None
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
                    "response": f"That sounds like an event. I need: {', '.join(missing)}.",
                    "tasks_created": [],
                    "events_created": [],
                    "needs_followup": True,
                    "followup_type": "event_details"
                })

            event_name = generate_event_name(text)

            events = read_json(user_id, "events.json")
            new_event = {
                "name": event_name,
                "description": text,
                "time": event_time,
                "location": location
            }
            events.append(new_event)
            write_json(user_id, "events.json", events)

            return jsonify({
                "response": "Event added.",
                "tasks_created": [],
                "events_created": [new_event],
                "needs_followup": False,
                "followup_type": None
            })

        tasks = read_json(user_id, "tasks.json")

        if len(text.split()) > 15:
            new_tasks = generate_daily_tasks(text)
        else:
            new_tasks = break_goal_into_tasks(text)

        created_tasks = []
        for task in new_tasks:
            task_obj = {
                "title": task,
                "completed": False
            }
            tasks.append(task_obj)
            created_tasks.append(task_obj)

        write_json(user_id, "tasks.json", tasks)

        session["state"] = "collecting_items"
        write_json(user_id, "session.json", session)

        return jsonify({
            "response": "I organized your input into actionable tasks.",
            "tasks_created": created_tasks,
            "events_created": [],
            "needs_followup": False,
            "followup_type": None
        })

    if state == "awaiting_reflection":
        parts = [p.strip() for p in text.split(";") if p.strip()]

        if len(parts) < 3:
            return jsonify({
                "response": "Please send 3 achievements separated by semicolons.",
                "tasks_created": [],
                "events_created": [],
                "needs_followup": True,
                "followup_type": "reflection"
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
            "tasks_created": [],
            "events_created": [],
            "needs_followup": False,
            "followup_type": None,
            "medal_path": medal_path
        })

    return jsonify({
        "response": "Session is complete.",
        "tasks_created": [],
        "events_created": [],
        "needs_followup": False,
        "followup_type": None
    })


@app.route("/tasks/<user_id>", methods=["GET"])
def get_tasks(user_id):
    return jsonify(read_json(user_id, "tasks.json"))


@app.route("/events/<user_id>", methods=["GET"])
def get_events(user_id):
    return jsonify(read_json(user_id, "events.json"))


@app.route("/events/<user_id>/<int:event_index>", methods=["DELETE"])
def delete_event(user_id, event_index):
    """Delete a single event by index"""
    events = read_json(user_id, "events.json")
    if 0 <= event_index < len(events):
        deleted_event = events.pop(event_index)
        write_json(user_id, "events.json", events)
        return jsonify({
            "success": True,
            "message": "Event deleted successfully.",
            "deleted_event": deleted_event
        })
    else:
        return jsonify({
            "success": False,
            "message": "Event index out of range."
        }), 400


@app.route("/events/<user_id>", methods=["DELETE"])
def delete_all_events(user_id):
    """Delete all events for a user"""
    write_json(user_id, "events.json", [])
    return jsonify({
        "success": True,
        "message": "All events deleted successfully."
    })


@app.route("/album/<user_id>", methods=["GET"])
def get_album(user_id):
    return jsonify(read_json(user_id, "medals.json"))


@app.route("/medals/<path:filename>", methods=["GET"])
def serve_medal(filename):
    return send_from_directory("medals", filename)


if __name__ == "__main__":
    app.run(debug=True)