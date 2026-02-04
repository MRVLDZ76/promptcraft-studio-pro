# PromptCraft Studio Pro - Django Backend

Django REST API backend for the PromptCraft Studio Pro video project creator.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7.0+

### Local Development Setup

1. **Create Virtual Environment**
```powershell
python -m venv venv
.\venv\Scripts\activate  # Windows
```

2. **Install Dependencies**
```powershell
pip install -r requirements.txt
```

3. **Configure Environment**
```powershell
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup Database**
```powershell
# Create PostgreSQL database
createdb promptcraft_db

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

5. **Run Development Server**
```powershell
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A config worker -l info

# Terminal 3: Celery beat (for scheduled tasks)
celery -A config beat -l info
```

6. **Access the API**
- API: http://localhost:8000/api/v1/
- Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/

## 📁 Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py          # Base settings
│   │   ├── development.py   # Dev settings
│   │   └── production.py    # Production settings
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/            # User authentication
│   ├── analyses/            # Debate analysis
│   ├── subscriptions/       # Billing & subscriptions
│   └── core/                # Shared utilities
└── tests/
```

## 🔑 API Endpoints

### Authentication
```
POST   /api/v1/auth/register/     - Register new user
POST   /api/v1/auth/login/        - Login (get JWT token)
POST   /api/v1/auth/refresh/      - Refresh JWT token
GET    /api/v1/auth/me/           - Get current user
POST   /api/v1/auth/logout/       - Logout
```

### Analyses
```
GET    /api/v1/analyses/          - List user's analyses
POST   /api/v1/analyses/          - Create new analysis
GET    /api/v1/analyses/{id}/     - Get specific analysis
DELETE /api/v1/analyses/{id}/     - Delete analysis
```

### Subscriptions
```
GET    /api/v1/subscriptions/plans/           - List available plans
POST   /api/v1/subscriptions/checkout/        - Create checkout session
GET    /api/v1/subscriptions/current/         - Get current subscription
POST   /api/v1/subscriptions/cancel/          - Cancel subscription
POST   /api/v1/webhooks/stripe/               - Stripe webhook
```

## 🧪 Testing

```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific app tests
pytest apps/accounts/tests/
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## 📚 Documentation

- [API Documentation](http://localhost:8000/api/docs/) - Auto-generated Swagger UI
- [Django Admin](http://localhost:8000/admin/) - Admin interface

## 🔒 Security

- All API keys stored server-side only
- JWT authentication with refresh tokens
- Rate limiting enabled
- CORS configured for frontend domains
- SQL injection prevention via Django ORM
- Input validation on all endpoints

## 📊 Monitoring

- Sentry for error tracking
- Django Debug Toolbar (dev only)
- Celery monitoring via Flower

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📝 License

Proprietary - All rights reserved
