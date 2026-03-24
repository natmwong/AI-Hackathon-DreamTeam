from ai import (
    break_goal_into_tasks_ai,
    classify_input_ai,
    generate_daily_tasks_ai
)

EVENT_KEYWORDS = [
    "meeting", "appointment", "call", "interview",
    "doctor", "dentist", "lunch", "dinner", "class"
]


def looks_like_event(text):
    text_lower = text.lower().strip()

    if len(text.split()) > 12:
        return False

    if any(word in text_lower for word in EVENT_KEYWORDS):
        return True

    return classify_input_ai(text) == "event"

def extract_time(text):
    text_lower = text.lower()
    if "am" in text_lower or "pm" in text_lower or ":" in text:
        return text
    return None


def extract_location(text):
    text_lower = text.lower()
    for marker in [" at ", " in "]:
        if marker in text_lower:
            idx = text_lower.find(marker)
            return text[idx + len(marker):].strip()
    return None


def generate_event_name(description):
    return description.strip().title()


def break_goal_into_tasks(goal):
    return break_goal_into_tasks_ai(goal)


def generate_daily_tasks(text):
    return generate_daily_tasks_ai(text)