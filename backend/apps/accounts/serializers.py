"""
Serializers for user authentication
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User profile serializer"""
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'full_name',
            'avatar_url',
            'bio',
            'subscription_tier',
            'subscription_status',
            'monthly_analysis_count',
            'monthly_analysis_limit',
            'monthly_transcription_count',
            'monthly_transcription_limit',
            'created_at',
            'last_login_at',
        ]
        read_only_fields = [
            'id',
            'subscription_tier',
            'subscription_status',
            'monthly_analysis_count',
            'monthly_analysis_limit',
            'created_at',
            'last_login_at',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'full_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Password fields did not match.'
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token with user data"""
    username_field = 'email'  # Use email as the login field
    
    def validate(self, attrs):
        # Allow login with email OR username
        email_or_username = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')
        
        if not email_or_username or not password:
            raise serializers.ValidationError('Must include email/username and password.')
        
        # Try to find user by email or username
        try:
            if '@' in email_or_username:
                user = User.objects.get(email=email_or_username)
            else:
                user = User.objects.get(username=email_or_username)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')
        
        # Authenticate user
        from django.contrib.auth import authenticate
        auth_user = authenticate(username=user.username, password=password)
        
        if not auth_user:
            raise serializers.ValidationError('Invalid password.')
        
        # Generate tokens manually instead of calling parent
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(auth_user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(auth_user).data
        }
        
        # Update last login
        auth_user.update_last_login()
        
        return data


class PasswordChangeSerializer(serializers.Serializer):
    """Change password serializer"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': 'Password fields did not match.'
            })
        return attrs
