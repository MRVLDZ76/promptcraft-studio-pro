"""
Custom permissions for API access
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners to edit objects
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner
        return obj.user == request.user


class HasActiveSubscription(permissions.BasePermission):
    """
    Permission check for active subscription
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.subscription_status == 'active'


class CanPerformAnalysis(permissions.BasePermission):
    """
    Permission check for analysis based on usage limits
    """
    message = 'Monthly analysis limit reached. Please upgrade your plan.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Only check for POST requests (creating new analysis)
        if request.method != 'POST':
            return True
        
        return request.user.can_perform_analysis()
