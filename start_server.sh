#!/bin/bash
# Gunicorn startup script for Django application

set -e

echo "Starting Gunicorn server..."

# Run Gunicorn with proper configuration
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8080 \
    --workers 4 \
    --threads 2 \
    --worker-class gthread \
    --worker-tmp-dir /dev/shm \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --capture-output \
    --enable-stdio-inheritance
