EVENT_KEYWORDS = [
    "meeting", "appointment", "call", "interview",
    "doctor", "dentist", "lunch", "dinner", "class"
]


def looks_like_event(text):
    text = text.lower()
    return any(word in text for word in EVENT_KEYWORDS)


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
    return [
        f"Define what done looks like for: {goal}",
        f"Start the first step for: {goal}",
        f"Make progress on: {goal}",
        f"Review and wrap up: {goal}"
    ]