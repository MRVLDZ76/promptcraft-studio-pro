from django.contrib import admin
from .models import ChronStudioProject, ChronStudioCharacter, ChronStudioScene, ChronStudioAsset, SocialMediaUpload, UserOAuthToken

@admin.register(ChronStudioProject)
class ChronStudioProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'category', 'status', 'current_step', 'created_at']
    list_filter = ['category', 'status', 'mode', 'current_step', 'is_favorite']
    search_fields = ['title', 'user__username', 'folder']

@admin.register(ChronStudioCharacter)
class ChronStudioCharacterAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'role', 'is_in_library']
    list_filter = ['is_in_library']

@admin.register(ChronStudioScene)
class ChronStudioSceneAdmin(admin.ModelAdmin):
    list_display = ['project', 'scene_number', 'status', 'duration_seconds']
    list_filter = ['status']

@admin.register(ChronStudioAsset)
class ChronStudioAssetAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'asset_type', 'file_size_mb', 'created_at']
    list_filter = ['asset_type']
    search_fields = ['project__title', 'user__username', 'description']

@admin.register(SocialMediaUpload)
class SocialMediaUploadAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'platform', 'status', 'progress', 'created_at', 'published_at']
    list_filter = ['platform', 'status']
    search_fields = ['project__title', 'user__username', 'platform_id']

@admin.register(UserOAuthToken)
class UserOAuthTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'platform_username', 'token_expiry', 'created_at']
    list_filter = ['platform']
    search_fields = ['user__username', 'platform_username', 'platform_user_id']
    readonly_fields = ['access_token', 'refresh_token']  # Don't edit tokens manually