# Generated migration for marketplace and audiobook specifications

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('publishing', '0001_initial'),
    ]

    operations = [
        # Print Marketplace Fields
        migrations.AddField(
            model_name='bookproject',
            name='marketplace',
            field=models.CharField(
                max_length=50,
                default='universal',
                help_text='Target marketplace for book publishing'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='trim_size',
            field=models.CharField(
                max_length=50,
                default='kdp_6x9',
                help_text='Book trim size (dimensions)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='paper_type',
            field=models.CharField(
                max_length=50,
                default='kdp_white',
                help_text='Paper type and quality'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='include_bleed',
            field=models.BooleanField(
                default=True,
                help_text='Include 0.125" bleed for color printing'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='color_interior',
            field=models.BooleanField(
                default=False,
                help_text='Color interior pages (increases cost)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='spine_width',
            field=models.FloatField(
                default=0.0,
                help_text='Calculated spine width in inches'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='cover_template_url',
            field=models.URLField(
                blank=True,
                null=True,
                help_text='URL to generated cover template with specifications'
            ),
        ),
        
        # Audiobook Marketplace Fields
        migrations.AddField(
            model_name='bookproject',
            name='audiobook_marketplace',
            field=models.CharField(
                max_length=50,
                default='acx_audible',
                help_text='Target audiobook marketplace'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='audio_format',
            field=models.CharField(
                max_length=50,
                default='mp3_acx',
                help_text='Audio format and bitrate'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='audio_bitrate',
            field=models.IntegerField(
                default=192,
                help_text='Audio bitrate in kbps'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='audio_mono_stereo',
            field=models.CharField(
                max_length=10,
                default='stereo',
                help_text='Audio channel configuration (mono or stereo)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='include_chapter_markers',
            field=models.BooleanField(
                default=True,
                help_text='Include ID3 chapter markers for navigation'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='include_opening_credits',
            field=models.BooleanField(
                default=True,
                help_text='Generate opening credits file'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='include_closing_credits',
            field=models.BooleanField(
                default=True,
                help_text='Generate closing credits file'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='generate_retail_sample',
            field=models.BooleanField(
                default=True,
                help_text='Generate 5-minute retail sample for ACX/Audible'
            ),
        ),
    ]
