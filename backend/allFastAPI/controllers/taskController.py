import string
import random
from datetime import datetime, UTC
from typing import List, Optional
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

# Assuming your store logic is in a file named task_store.py
# from storage import task_store as store

# --- Models (Schemas) ---

class Task(BaseModel):
    id: str
    title: str
    isCompleted: bool = False
    date: str

class CreateTasksRequest(BaseModel):
    # This automatically handles the "non-empty array of strings" validation
    titles: List[str] = Field(..., min_items=1)

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    isCompleted: Optional[bool] = None

# --- Utility ---

def generate_id(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def build_task(title: str) -> dict:
    return {
        "id": generate_id(),
        "title": title.strip(),
        "isCompleted": False,
        "date": datetime.now(UTC).isoformat()
    }

# --- CREATE ---

async def create_tasks(payload: CreateTasksRequest):
    # Pydantic already validated that titles is a list of strings
    if any(not t.strip() for t in payload.titles):
        raise HTTPException(
            status_code=400, 
            detail="All entries in 'titles' must be non-empty strings."
        )

    new_tasks = [build_task(t) for t in payload.titles]
    # inserted = store.insert_many(new_tasks)
    inserted = new_tasks # Placeholder for store logic

    return {
        "success": True,
        "message": f"{len(inserted)} task(s) created.",
        "count": len(inserted),
        "tasks": inserted
    }

# --- READ ALL ---

async def get_all_tasks(completed: Optional[bool] = None, search: Optional[str] = None):
    # tasks = store.get_all()
    tasks = [] # Placeholder

    if completed is not None:
        tasks = [t for t in tasks if t['isCompleted'] == completed]

    if search:
        kw = search.lower()
        tasks = [t for t in tasks if kw in t['title'].lower()]

    # Sort: newest first
    tasks.sort(key=lambda x: x['date'], reverse=True)

    return {"success": True, "count": len(tasks), "tasks": tasks}

# --- READ ONE ---

async def get_task_by_id(task_id: str):
    # task = store.get_by_id(task_id)
    task = None # Placeholder
    
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")
    
    return {"success": True, "task": task}

# --- UPDATE ---

async def update_task(task_id: str, payload: UpdateTaskRequest):
    if payload.title is None and payload.isCompleted is None:
        raise HTTPException(status_code=400, detail='Provide "title" or "isCompleted".')

    if payload.title is not None and not payload.title.strip():
        raise HTTPException(status_code=400, detail='"title" cannot be empty.')

    fields = payload.model_dump(exclude_unset=True)
    if 'title' in fields:
        fields['title'] = fields['title'].strip()

    # updated = store.update_by_id(task_id, fields)
    updated = None # Placeholder

    if not updated:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")

    return {"success": True, "message": "Task updated.", "task": updated}

# --- DELETE ---

async def delete_task(task_id: str):
    # deleted = store.delete_by_id(task_id)
    deleted = None # Placeholder
    
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")
    
    return {"success": True, "message": "Task deleted.", "task": deleted}

async def delete_all_tasks():
    # count = store.clear_all()
    count = 0
    return {"success": True, "message": f"{count} task(s) deleted.", "count": count}
