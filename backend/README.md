# Backend

Backend service for the productivity assistant chatbot.

## Features
- Daily planning (goals → tasks)
- Event detection + follow-ups
- End-of-day reflection
- Medal generation

## Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   (Windows: venv\Scripts\activate)

pip install flask flask-cors pillow python-dotenv google-genai
```

Paste .env file into backend folder

Run:
``python app.py``

Server:
http://127.0.0.1:5000

## Routes

POST /clock-in  
POST /message  
POST /clock-out  

GET /tasks/<user_id>  
GET /events/<user_id>  
GET /album/<user_id>  

## Chatbot Behavior

Long input → generates task list  
Short goal → breaks into steps  

Event:
"Doctor appointment" → asks for time/location  
"at 3 PM in Downtown Clinic" → saves event  

Reflection:
"Task1; Task2; Task3" → saves + creates medal  

## Frontend Notes

- Send ALL messages to /message  
- Always render `response`  
- If tasks_created → update tasks  
- If events_created → update events  
- If needs_followup → continue chat  

## Notes

- Uses local JSON storage  
- No database  
- "alice" is the test user i used
