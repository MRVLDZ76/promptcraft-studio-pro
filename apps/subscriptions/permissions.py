from rest_framework.permissions import BasePermission


class HasActiveSubscription(BasePermission):
    """Check if user has active subscription"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin always has access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user has active subscription
        try:
            subscription = request.user.subscription
            return subscription.is_active
        except:
            return False


class HasFeatureAccess(BasePermission):
    """Check if user's plan allows specific feature"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin always has access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Get required tier from view
        required_tier = getattr(view, 'required_tier', 'free')
        
        # Check user's tier
        user_tier = request.user.subscription_tier
        
        tier_hierarchy = {'free': 0, 'pro': 1, 'enterprise': 2}
        user_level = tier_hierarchy.get(user_tier, 0)
        required_level = tier_hierarchy.get(required_tier, 0)
        
        return user_level >= required_level
