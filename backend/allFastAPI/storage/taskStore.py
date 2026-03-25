import json
import os
from typing import List, Optional, Union, Any
from localStoragePy import localStoragePy

import logging
from fastapi import HTTPException


# Persisted to ./data/localStorage on the filesystem
# Ensure the directory exists or LocalStorage will handle it based on your OS
storage_path = os.path.join(os.path.dirname(__file__), '../data/localStorage')
storage = localStoragePy(storage_path)

TASKS_KEY = 'tasks'


# Setup logging to see errors in your terminal
logger = logging.getLogger(__name__)

def _safe_storage_call(func, *args, **kwargs):
    """
    Wrapper to catch OS-level permission or locked file errors.
    """
    try:
        return func(*args, **kwargs)
    except PermissionError:
        logger.error("Storage Error: Permission denied. Check folder permissions.")
        # Raise a 503 Service Unavailable or 500 Internal Server Error
        raise HTTPException(
            status_code=503, 
            detail="Storage is currently read-only or locked. Please contact admin."
        )
    except Exception as e:
        logger.error(f"Unexpected Storage Error: {e}")
        raise HTTPException(status_code=500, detail="Internal storage error.")


# ─── Low-level helpers ────────────────────────────────────────────────────────

_BACKUP_MEMORY_STORE = []

def _read_all():
    try:
        raw = storage.getItem(TASKS_KEY)
        return json.loads(raw) if raw else []
    except PermissionError:
        return _BACKUP_MEMORY_STORE # Return what we have in RAM

def _write_all(tasks: List[dict]) -> None:
    """Persist the full task list back to storage."""
    storage.setItem(TASKS_KEY, json.dumps(tasks))

# ─── Public API ───────────────────────────────────────────────────────────────

def get_all() -> List[dict]:
    """Return every task in the store."""
    return _read_all()

def get_by_id(task_id: str) -> Optional[dict]:
    """Find a single task by id. Returns the task or None."""
    tasks = _read_all()
    # Next() with a default of None is the Pythonic equivalent of JS .find()
    return next((t for t in tasks if t.get('id') == task_id), None)

def insert_many(new_tasks):
    current = get_all() # This already uses the safe wrapper
    to_insert = new_tasks if isinstance(new_tasks, list) else [new_tasks]
    
    # Wrap the write operation
    _safe_storage_call(_write_all, current + to_insert)
    return to_insert

def update_by_id(task_id: str, fields: dict) -> Optional[dict]:
    """
    Update fields on an existing task by id.
    Only provided fields are updated. Returns updated task or None.
    """
    tasks = _read_all()
    
    # Find index
    idx = next((i for i, t in enumerate(tasks) if t.get('id') == task_id), -1)
    if idx == -1:
        return None

    # Prevent overwriting id or date (Equivalent to JS rest/destructuring)
    safe_fields = {k: v for k, v in fields.items() if k not in ['id', 'date']}
    
    # Update dict in place
    tasks[idx].update(safe_fields)
    _write_all(tasks)
    return tasks[idx]

def delete_by_id(task_id: str) -> Optional[dict]:
    """Delete a task by id. Returns the deleted task or None."""
    tasks = _read_all()
    target = next((t for t in tasks if t.get('id') == task_id), None)
    
    if not target:
        return None
        
    filtered_tasks = [t for t in tasks if t.get('id') != task_id]
    _write_all(filtered_tasks)
    return target

def clear_all() -> int:
    """Wipe all tasks. Returns the count that were cleared."""
    tasks = _read_all()
    count = len(tasks)
    storage.removeItem(TASKS_KEY)
    return count
