# Start Celery Worker for Video Production
# Run this script to start the Celery worker

Write-Host "Starting Celery Worker..." -ForegroundColor Green
Write-Host "Make sure Redis is running on localhost:6379" -ForegroundColor Yellow
Write-Host ""

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Start Celery worker with Windows-compatible settings
celery -A config worker -l info --pool=solo

# Note: Use Ctrl+C to stop the worker
