"""
Custom exception handlers
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler to return consistent error responses
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Customize error response format
        custom_response = {
            'error': True,
            'status_code': response.status_code,
        }
        
        # Add error details
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_response['message'] = response.data['detail']
            else:
                custom_response['errors'] = response.data
        else:
            custom_response['message'] = str(response.data)
        
        response.data = custom_response
    
    return response


class SubscriptionRequiredException(Exception):
    """Exception raised when subscription is required"""
    pass


class RateLimitExceededException(Exception):
    """Exception raised when rate limit is exceeded"""
    pass


class UsageLimitExceededException(Exception):
    """Exception raised when usage limit is exceeded"""
    pass
