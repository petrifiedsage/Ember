#!/bin/sh
# Start arq background task worker in the background
echo "Starting arq background worker..."
arq app.workers.tasks.WorkerSettings &

# Start Uvicorn FastAPI server in the foreground
echo "Starting Uvicorn API server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
