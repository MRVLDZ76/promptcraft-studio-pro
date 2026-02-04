from django.contrib import admin
from apps.publishing.models import BookProject, Chapter, ContentBlock


@admin.register(BookProject)
class BookProjectAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author_name', 'user', 'project_type',
        'status', 'progress_percentage', 'total_words', 'created_at'
    ]
    list_filter = ['status', 'project_type', 'created_at']
    search_fields = ['title', 'author_name', 'user__email']
    readonly_fields = [
        'random_seed', 'total_words', 'total_blocks',
        'estimated_pages', 'estimated_reading_time',
        'created_at', 'updated_at', 'completed_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'subtitle', 'author_name', 'description', 'project_type')
        }),
        ('Processing Configuration', {
            'fields': ('default_processing_mode', 'global_context', 'random_seed')
        }),
        ('Generation Settings', {
            'fields': (
                'enable_images', 'image_style',
                'enable_audio', 'voice_model'
            )
        }),
        ('Output Formats', {
            'fields': (
                'generate_pdf', 'generate_epub',
                'generate_html', 'generate_audiobook'
            )
        }),
        ('Status', {
            'fields': ('status', 'progress_percentage')
        }),
        ('Generated Assets', {
            'fields': ('pdf_url', 'epub_url', 'html_url', 'audiobook_url')
        }),
        ('Statistics', {
            'fields': (
                'total_words', 'total_blocks',
                'estimated_pages', 'estimated_reading_time'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = [
        'chapter_number', 'title', 'book', 'word_count', 'estimated_pages'
    ]
    list_filter = ['book', 'created_at']
    search_fields = ['title', 'book__title']
    readonly_fields = ['word_count', 'estimated_pages', 'created_at', 'updated_at']


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'chapter', 'sequence_order', 'processing_mode',
        'status', 'word_count', 'created_at'
    ]
    list_filter = ['status', 'processing_mode', 'chapter__book']
    search_fields = ['input_text', 'processed_text']
    readonly_fields = [
        'word_count', 'character_count',
        'created_at', 'updated_at', 'processed_at'
    ]
    
    fieldsets = (
        ('Chapter Info', {
            'fields': ('chapter', 'sequence_order')
        }),
        ('Content', {
            'fields': ('input_text', 'processed_text')
        }),
        ('Processing', {
            'fields': ('processing_mode', 'mode_parameters', 'status', 'error_message')
        }),
        ('Generated Assets', {
            'fields': ('image_url', 'image_prompt', 'audio_url', 'audio_duration')
        }),
        ('Metadata', {
            'fields': ('word_count', 'character_count', 'created_at', 'updated_at', 'processed_at')
        }),
    )
