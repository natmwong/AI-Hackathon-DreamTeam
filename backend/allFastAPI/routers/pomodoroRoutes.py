from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import logging

# Assuming you've created a similar service in python
from services.pomodoroService import get_pomodoro_context


# --- REQUEST SCHEMA ---
class LoginRequest(BaseModel):
    # Matches: { "login_time": "2024-01-15T09:30:00" }
    login_time: Optional[str] = Field(None, example="2024-01-15T09:30:00")

# --- RESPONSE SCHEMAS (From your image) ---
class PomodoroConfig(BaseModel):
    work_minutes: int
    break_minutes: int
    cycle_minutes: int

class LoginResponse(BaseModel):
    success: bool
    active: bool
    message: str
    work_mode: str
    current_pomodoro_time: int
    current_pomodoro_time_formatted: str
    pomodoros_completed_this_shift: int
    shift_start: Optional[str] = None
    shift_end: str
    next_shift_start: Optional[str] = None
    elapsed_shift_minutes: Optional[int] = None
    login_time: str
    pomodoro_config: PomodoroConfig


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login", response_model=LoginResponse)
async def login(body: Optional[LoginRequest] = None):
    """
    Receives login_time in body. 
    Returns the full pomodoro context dictionary.
    """
    try:
        # 1. Extract time from body or use server 'now'
        input_time = None
        if body and body.login_time:
            try:
                # Convert ISO string to datetime object
                input_time = datetime.fromisoformat(body.login_time.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid ISO 8601 date format")

        # 2. Get the dictionary from your service logic
        # (This service should return the keys exactly as shown in your image)
        context = get_pomodoro_context(input_time)
        
        return context

    except Exception as e:
        # Standard error handling as per your Express app
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/status")
async def get_status(time: Optional[str] = Query(None, pattern=r"^\d{2}:\d{2}$")):
    try:
        login_time = datetime.now()

        if time:
            try:
                h, m = map(int, time.split(":"))
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    raise ValueError
                login_time = login_time.replace(hour=h, minute=m, second=0, microsecond=0)
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid time format. Use HH:MM (e.g. ?time=09:30)."
                )

        context = get_pomodoro_context(login_time)
        return {context}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"[pomodoro/status] Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
