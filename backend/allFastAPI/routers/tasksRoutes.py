from fastapi import APIRouter, status
from typing import List, Optional

# Assuming your controller logic is in a file named taskController.py
from controllers import taskController

router = APIRouter()

# ── Collection routes (/api/tasks) ──

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_tasks(payload: List[str]):
    """Create tasks from a list of titles"""
    return await taskController.create_tasks(payload)

@router.get("/")
async def get_all_tasks(completed: Optional[bool] = None):
    """Get all tasks (with optional filters)"""
    return await taskController.get_all_tasks(completed)

@router.delete("/")
async def delete_all_tasks():
    """Delete ALL tasks"""
    return await taskController.delete_all_tasks()


# ── Individual resource routes (/api/tasks/{id}) ──

@router.get("/{task_id}")
async def get_task_by_id(task_id: str):
    """Get one task by id"""
    return await taskController.get_task_by_id(task_id)

@router.patch("/{task_id}")
async def update_task(task_id: str, update_data: dict):
    """Update title / isCompleted"""
    return await taskController.update_task(task_id, update_data)

@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete one task"""
    return await taskController.delete_task(task_id)
