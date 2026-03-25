import os
from fastapi import FastAPI
from datetime import datetime
from typing import Optional

from contextlib import asynccontextmanager


# Import the router objects from your files
from routers.pomodoroRoutes import router as pomodoro_router
from routers.tasksRoutes import router as tasks_router


# Ensure the data directory exists and is writable before starting the app

def ensure_storage_ready(path="./data"):
    # Create the directory if it doesn't already exist
    os.makedirs(path, exist_ok=True)
    
    # Check if the process has write access
    if not os.access(path, os.W_OK):
        # Optional: Attempt to set permissions to 755 (rwxr-xr-x)
        try:
            os.chmod(path, 0o755)
        except PermissionError:
            print(f"Error: No write permission for {path}. Fix this in your OS.")
            return False
    return True

ensure_storage_ready()


# Import your route logic (similar to require('./routes/...'))
# from routers import pomodoro, tasks 

app = FastAPI()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Logic ---
    # This runs BEFORE the application starts receiving requests
    print("Application is starting up...")
    
    # Example: Check for folder permissions
    if not os.access("./data", os.W_OK):
        print("WARNING: No write access to /data.")
    
    yield  # The app runs while paused here
    
    # --- Shutdown Logic ---
    # This runs AFTER the application stops receiving requests
    print("Application is shutting down...")


# This is the Python equivalent of app.use('/api/pomodoro', ...)
app.include_router(pomodoro_router, prefix="/api/pomodoro", tags=["Pomodoro"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Example of how your Pomodoro router would integrate
# app.include_router(pomodoro.router, prefix="/api/pomodoro")
# app.include_router(tasks.router, prefix="/api/tasks")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
