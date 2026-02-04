"""
Authentication URLs
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Registration & Login
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # JWT Token
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Profile
    path('me/', views.current_user_view, name='current_user'),
    path('profile/', views.update_profile_view, name='update_profile'),
    path('password/change/', views.change_password_view, name='change_password'),
]
