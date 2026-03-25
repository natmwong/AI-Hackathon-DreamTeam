import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def ask_gemini(prompt: str) -> str:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text.strip() if response.text else ""


def break_goal_into_tasks_ai(goal: str) -> list[str]:
    prompt = f"""
You are helping a user plan their workday.

Break this goal into exactly 4 short, actionable tasks.

Return either:
1. JSON like {{"tasks":["task 1","task 2","task 3","task 4"]}}
OR
2. a simple numbered list with 4 items.

Goal: {goal}
""".strip()

    text = ask_gemini(prompt)

    try:
        data = json.loads(text)
        tasks = data.get("tasks", [])
        if isinstance(tasks, list):
            cleaned = [str(t).strip() for t in tasks if str(t).strip()]
            if cleaned:
                return cleaned[:4]
    except Exception:
        pass

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    parsed = []

    for line in lines:
        if line and line[0].isdigit():
            parts = line.split(".", 1)
            if len(parts) == 2:
                parsed.append(parts[1].strip())
            else:
                parsed.append(line)

    if parsed:
        return parsed[:4]

    return [
        f"Define what done looks like for: {goal}",
        f"Start the first step for: {goal}",
        f"Make progress on: {goal}",
        f"Review and wrap up: {goal}",
    ]


def generate_daily_tasks_ai(text: str) -> list[str]:
    prompt = f"""
You are an AI productivity assistant.

The user describes their day in a paragraph.

Extract the main actionable tasks.
Do not explain.
Do not summarize.
Turn the input into a clean task list.

Return either:
1. JSON like {{"tasks":["task 1","task 2","task 3"]}}
OR
2. a simple numbered list.

Input:
{text}
""".strip()

    response = ask_gemini(prompt)

    try:
        data = json.loads(response)
        tasks = data.get("tasks", [])
        if isinstance(tasks, list):
            cleaned = [str(t).strip() for t in tasks if str(t).strip()]
            if cleaned:
                return cleaned
    except Exception:
        pass

    lines = [line.strip() for line in response.splitlines() if line.strip()]
    parsed = []

    for line in lines:
        if line and line[0].isdigit():
            parts = line.split(".", 1)
            if len(parts) == 2:
                parsed.append(parts[1].strip())
            else:
                parsed.append(line)

    if parsed:
        return parsed

    return break_goal_into_tasks_ai(text)


def classify_input_ai(text: str) -> str:
    prompt = f"""
Classify this user input as either:
- goal
- event

A goal is something the user wants to accomplish.
An event is something scheduled or happening at a time/place.

Return only one word: goal or event

Input: {text}
""".strip()

    result = ask_gemini(prompt).lower()
    return "event" if "event" in result else "goal"