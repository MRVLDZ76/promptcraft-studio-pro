# Quick Start Commands

## First Time Setup
```powershell
# Run the automated setup script
.\setup.ps1

# Or manual setup:
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Daily Development
```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Start Django server
python manage.py runserver

# In separate terminals:
celery -A config worker -l info
celery -A config beat -l info
```

## Using Docker
```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Database Commands
```powershell
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

## Testing
```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test file
pytest apps/accounts/tests/test_auth.py
```

## API Testing
```powershell
# Register user
$body = @{
    email = "test@example.com"
    username = "testuser"
    password = "TestPass123!"
    password_confirm = "TestPass123!"
    full_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/auth/register/" -Body $body -ContentType "application/json"

# Login
$body = @{
    username = "testuser"
    password = "TestPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/auth/login/" -Body $body -ContentType "application/json"
$token = $response.access

# Get current user
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/v1/auth/me/" -Headers @{Authorization="Bearer $token"}
```

## Useful URLs
- Admin Panel: http://localhost:8000/admin/
- API Documentation: http://localhost:8000/api/docs/
- API Schema: http://localhost:8000/api/schema/

## Troubleshooting
```powershell
# Reset database
python manage.py flush

# Clear cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()

# Show migrations
python manage.py showmigrations

# Create new migration
python manage.py makemigrations app_name

# View SQL for migration
python manage.py sqlmigrate app_name migration_number
```
