"""
Rate limiting middleware
"""
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings


class RateLimitMiddleware:
    """
    Rate limiting middleware to prevent API abuse
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip rate limiting for non-API requests
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        # Check rate limit
        if not self.check_rate_limit(request):
            return JsonResponse(
                {
                    'error': 'Rate limit exceeded',
                    'detail': 'Too many requests. Please try again later or upgrade your plan.'
                },
                status=429
            )
        
        response = self.get_response(request)
        return response
    
    def check_rate_limit(self, request):
        """Check if request is within rate limits"""
        user = request.user
        
        if user.is_authenticated:
            # User-based rate limiting
            if user.is_staff or user.is_superuser:
                return True  # No rate limiting for staff
            
            # Get user's subscription tier
            tier = user.subscription_tier
            
            if tier == 'enterprise':
                return True  # No rate limiting for enterprise
            
            # Set limits based on tier
            if tier == 'pro':
                limit = 100  # 100 requests per hour
            else:  # free tier
                limit = 20  # 20 requests per hour
            
            key = f'rate_limit_user_{user.id}'
            window = 3600  # 1 hour
        else:
            # IP-based rate limiting for anonymous users
            ip = self.get_client_ip(request)
            key = f'rate_limit_ip_{ip}'
            limit = 10  # 10 requests per hour
            window = 3600
        
        # Check cache
        count = cache.get(key, 0)
        if count >= limit:
            return False
        
        # Increment counter
        cache.set(key, count + 1, window)
        return True
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
