from datetime import datetime, timedelta
import math

# --- Constants ---
POMODORO_WORK_MINUTES = 25
POMODORO_BREAK_MINUTES = 5
POMODORO_CYCLE_MINUTES = POMODORO_WORK_MINUTES + POMODORO_BREAK_MINUTES  # 30 min

SHIFTS = {
    "morning": {"start": (8, 0), "end": (12, 0)},
    "afternoon": {"start": (13, 0), "end": (17, 0)},
}

# --- Helpers ---

def to_minutes(h: int, m: int) -> int:
    """Convert hours and minutes to total minutes since midnight."""
    return h * 60 + m

def to_time_string(total_minutes: int) -> str:
    """Convert total minutes since midnight to 'HH:MM' string."""
    h, m = divmod(total_minutes, 60)
    return f"{h:02d}:{m:02d}"

def format_duration(total_minutes: int) -> str:
    """Format minutes as 'Xh Ym' or 'Ym'."""
    h, m = divmod(total_minutes, 60)
    if h > 0 and m > 0:
        return f"{h}h {m}m"
    return f"{h}h" if h > 0 else f"{m}m"

def get_pomodoro_state(elapsed_minutes: int):
    """Calculate current position in the 30-minute work/break cycle."""
    position_in_cycle = elapsed_minutes % POMODORO_CYCLE_MINUTES
    cycles_completed = elapsed_minutes // POMODORO_CYCLE_MINUTES

    if position_in_cycle < POMODORO_WORK_MINUTES:
        remaining_work = POMODORO_WORK_MINUTES - position_in_cycle
        return {
            "work_mode": "work",
            "current_pomodoro_time": remaining_work * 60,  # seconds
            "pomodoros_completed": cycles_completed,
        }
    else:
        break_elapsed = position_in_cycle - POMODORO_WORK_MINUTES
        remaining_break = POMODORO_BREAK_MINUTES - break_elapsed
        return {
            "work_mode": "break",
            "current_pomodoro_time": remaining_break * 60,  # seconds
            "pomodoros_completed": cycles_completed + 1,
        }

# --- Core Logic ---

def build_next_shift_response(message, next_start, shift_end, login_time):
    """Helper for responses when user is outside active hours."""
    return {
        "success": True,
        "active": False,
        "message": message,
        "work_mode": "off",
        "current_pomodoro_time": 0,
        "current_pomodoro_time_formatted": "0m",
        "pomodoros_completed_this_shift": 0,
        "shift_start": None,
        "shift_end": shift_end,
        "next_shift_start": next_start,
        "login_time": login_time.isoformat(),
        "pomodoro_config": {
            "work_minutes": POMODORO_WORK_MINUTES,
            "break_minutes": POMODORO_BREAK_MINUTES,
            "cycle_minutes": POMODORO_CYCLE_MINUTES,
        },
    }

def get_pomodoro_context(login_time: datetime = None):
    if not login_time:
        login_time = datetime.now()

    login_total_minutes = to_minutes(login_time.hour, login_time.minute)

    m_start = to_minutes(*SHIFTS["morning"]["start"])
    m_end = to_minutes(*SHIFTS["morning"]["end"])
    a_start = to_minutes(*SHIFTS["afternoon"]["start"])
    a_end = to_minutes(*SHIFTS["afternoon"]["end"])

    # 1. Before Work
    if login_total_minutes < m_start:
        return build_next_shift_response(
            "Workday has not started yet.", 
            to_time_string(m_start), to_time_string(a_end), login_time
        )

    # 2. Morning Shift
    if m_start <= login_total_minutes < m_end:
        shift_start_str = to_time_string(m_start)
        shift_end_str = to_time_string(m_end)
        elapsed = login_total_minutes - m_start
        msg = "Good morning! Working until noon break."

    # 3. Lunch Break
    elif m_end <= login_total_minutes < a_start:
        return build_next_shift_response(
            "Lunch break in progress.", 
            to_time_string(a_start), to_time_string(a_end), login_time
        )

    # 4. Afternoon Shift
    elif a_start <= login_total_minutes < a_end:
        shift_start_str = to_time_string(a_start)
        shift_end_str = to_time_string(a_end)
        elapsed = login_total_minutes - a_start
        msg = "Good afternoon! Working until 17:00."

    # 5. After Hours
    else:
        return build_next_shift_response(
            "Workday complete.", 
            "08:00 (tomorrow)", to_time_string(a_end), login_time
        )

    # Calculate State for active shifts
    pom_state = get_pomodoro_state(elapsed)

    return {
        "success": True,
        "active": True,
        "message": msg,
        "work_mode": pom_state["work_mode"],
        "current_pomodoro_time": pom_state["current_pomodoro_time"],
        "current_pomodoro_time_formatted": format_duration(math.ceil(pom_state["current_pomodoro_time"] / 60)),
        "pomodoros_completed_this_shift": pom_state["pomodoros_completed"],
        "shift_start": shift_start_str,
        "shift_end": shift_end_str,
        "elapsed_shift_minutes": elapsed,
        "login_time": login_time.isoformat(),
        "pomodoro_config": {
            "work_minutes": POMODORO_WORK_MINUTES,
            "break_minutes": POMODORO_BREAK_MINUTES,
            "cycle_minutes": POMODORO_CYCLE_MINUTES,
        },
    }
