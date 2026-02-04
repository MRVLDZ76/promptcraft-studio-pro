# PromptCraft Studio Pro - Backend Setup Script
# Run this to set up the Django backend quickly

Write-Host "🚀 PromptCraft Studio Pro - Django Backend Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "✓ Checking Python version..." -ForegroundColor Yellow
$pythonVersion = py --version
Write-Host "  $pythonVersion" -ForegroundColor Green
Write-Host ""

# Create virtual environment
Write-Host "✓ Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "  Virtual environment already exists" -ForegroundColor Gray
} else {
    py -m venv venv
    Write-Host "  Virtual environment created" -ForegroundColor Green
}
Write-Host ""

# Activate virtual environment
Write-Host "✓ Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
Write-Host "  Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "✓ Installing dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install --upgrade pip | Out-Null
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "  All dependencies installed" -ForegroundColor Green
Write-Host ""

# Create .env file if it doesn't exist
Write-Host "✓ Setting up environment file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  .env file already exists" -ForegroundColor Gray
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "  .env file created from template" -ForegroundColor Green
    Write-Host "  ⚠️  IMPORTANT: Edit .env with your API keys!" -ForegroundColor Red
}
Write-Host ""

# Check if Docker is running (for optional PostgreSQL/Redis)
Write-Host "✓ Checking for Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker is running" -ForegroundColor Green
    Write-Host ""
    
    $startDocker = Read-Host "  Start PostgreSQL and Redis with Docker? (y/n)"
    if ($startDocker -eq 'y') {
        Write-Host "  Starting Docker containers..." -ForegroundColor Yellow
        docker-compose up -d db redis
        Write-Host "  PostgreSQL and Redis started" -ForegroundColor Green
        Start-Sleep -Seconds 5
    }
} else {
    Write-Host "  Docker not found (optional)" -ForegroundColor Gray
    Write-Host "  You'll need to install PostgreSQL and Redis manually" -ForegroundColor Yellow
}
Write-Host ""

# Run migrations
Write-Host "✓ Running database migrations..." -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py makemigrations
.\venv\Scripts\python.exe manage.py migrate
Write-Host "  Database migrations complete" -ForegroundColor Green
Write-Host ""

# Create superuser prompt
Write-Host "✓ Create superuser account?" -ForegroundColor Yellow
$createSuperuser = Read-Host "  Create admin user now? (y/n)"
if ($createSuperuser -eq 'y') {
    .\venv\Scripts\python.exe manage.py createsuperuser
}
Write-Host ""

# Success message
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your API keys" -ForegroundColor White
Write-Host "2. Run: python manage.py runserver" -ForegroundColor White
Write-Host "3. Visit: http://localhost:8000/admin/" -ForegroundColor White
Write-Host "4. API Docs: http://localhost:8000/api/docs/" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host ""

# Ask to start server
$startServer = Read-Host "Start development server now? (y/n)"
if ($startServer -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Starting Django development server..." -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    .\venv\Scripts\python.exe manage.py runserver
}
