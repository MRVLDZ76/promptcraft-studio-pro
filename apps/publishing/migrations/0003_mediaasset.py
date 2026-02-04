# MediaAsset Model Migration
# Creates table for user's personal media library

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('publishing', '0002_add_cover_and_publishing_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='MediaAsset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('alt_text', models.CharField(blank=True, max_length=500)),
                ('file', models.ImageField(upload_to='media_library/')),
                ('thumbnail', models.ImageField(blank=True, upload_to='media_library/thumbs/')),
                ('source', models.CharField(choices=[('upload', 'Upload'), ('generated', 'AI Generated'), ('unsplash', 'Unsplash')], default='upload', max_length=20)),
                ('width', models.IntegerField(default=0)),
                ('height', models.IntegerField(default=0)),
                ('file_size', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('book', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='media_assets', to='publishing.bookproject')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='media_assets', to='accounts.user')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['user', '-created_at'], name='publishing_m_user_id_created_idx'),
                ],
            },
        ),
    ]
